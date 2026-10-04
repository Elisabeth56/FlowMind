import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { aiErrorResponse } from '@/lib/ai/http'
import { summarizeWeek } from '@/lib/ai/weekly-summary'
import { addDays, startOfDayIn, weekIn } from '@/lib/dates'
import { completionRate, isEmptyWeek, planCompletionRate, trendOf } from '@/lib/weekly'

type Client = Awaited<ReturnType<typeof createClient>>

// The user's week: seven days from their chosen weekday, in their own timezone.
async function userWeek(supabase: Client, userId: string, weekOffset: number) {
  const { data } = await supabase
    .from('profiles')
    .select('timezone, weekly_summary_day')
    .eq('id', userId)
    .single()
  const timeZone = data?.timezone ?? 'UTC'
  return { timeZone, ...weekIn(timeZone, new Date(), weekOffset, data?.weekly_summary_day ?? 0) }
}

async function weekStats(supabase: Client, start: string, end: string) {
  const { data, error } = await supabase.rpc('week_stats', { p_week_start: start, p_week_end: end }).single()
  if (error) throw new Error(`Could not compute the week: ${error.message}`)
  return { ...data, projects: data.projects as Array<{ name: string; completed: number }> }
}

// POST - write the reflection for a week. The numbers are computed; the model writes the words.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { weekOffset = 0 } = await request.json() // 0 = this week, -1 = last week
    const { timeZone, start: weekStart, end: weekEnd } = await userWeek(supabase, user.id, Number(weekOffset) || 0)

    const { data: existingSummary } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle()
    if (existingSummary) {
      return NextResponse.json({ success: true, summary: existingSummary, cached: true })
    }

    const [stats, lastWeek] = await Promise.all([
      weekStats(supabase, weekStart, weekEnd),
      weekStats(supabase, addDays(weekStart, -7), addDays(weekEnd, -7)),
    ])

    // Nothing happened this week: say so, and don't spend a model call inventing a story
    if (isEmptyWeek(stats)) {
      return NextResponse.json({ success: true, summary: null, empty: true })
    }

    const refusal = await refuseAiCall(supabase, user.id)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    // The items themselves, for the model to write about
    const weekStartsAt = startOfDayIn(timeZone, weekStart).toISOString()
    const weekEndsAt = startOfDayIn(timeZone, addDays(weekEnd, 1)).toISOString()
    const [{ data: completedItems }, { data: pendingItems }] = await Promise.all([
      supabase
        .from('inbox_items')
        .select('content, projects (name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', weekStartsAt)
        .lt('completed_at', weekEndsAt)
        .limit(40),
      supabase
        .from('inbox_items')
        .select('content, priority, created_at')
        .eq('user_id', user.id)
        .in('status', ['inbox', 'organized', 'in_progress'])
        .lt('created_at', weekStartsAt)
        .order('priority', { ascending: false })
        .limit(20),
    ])

    const trend = trendOf(stats.items_completed, lastWeek.items_completed)
    const planRate = planCompletionRate(stats.plan_steps, stats.plan_steps_done)

    const written = await summarizeWeek({
      userId: user.id,
      weekStart,
      weekEnd,
      itemsCreated: stats.items_created,
      itemsCompleted: stats.items_completed,
      itemsCarriedOver: stats.items_carried_over,
      completionRate: completionRate(stats.items_created, stats.items_carried_over, stats.items_completed),
      planCompletionRate: planRate,
      trend: isEmptyWeek(lastWeek)
        ? 'no activity last week to compare with'
        : `${trend} (${stats.items_completed} completed, ${lastWeek.items_completed} last week)`,
      projects: stats.projects,
      completedItems: (completedItems ?? []).map((item) => ({
        content: item.content,
        project_name: (item.projects as unknown as { name: string } | null)?.name ?? null,
      })),
      pendingItems: (pendingItems ?? []).map((item) => ({
        content: item.content,
        priority: item.priority,
        ageDays: Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86_400_000),
      })),
    })

    const { data: savedSummary, error: saveError } = await supabase
      .from('weekly_summaries')
      .insert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        // computed
        items_created: stats.items_created,
        items_completed: stats.items_completed,
        items_carried_over: stats.items_carried_over,
        plan_completion_rate: planRate,
        project_counts: stats.projects,
        productivity_trend: isEmptyWeek(lastWeek) ? null : trend,
        // written by the model
        summary_text: written.summary_text,
        accomplishments: written.accomplishments,
        keep: written.keep,
        try_next: written.try_next,
      })
      .select()
      .single()
    if (saveError) throw new Error(`Could not save summary: ${saveError.message}`)

    return NextResponse.json({ success: true, summary: savedSummary })
  } catch (error) {
    console.error('Weekly summary API error:', error)

    const aiFailure = aiErrorResponse(error)
    if (aiFailure) return aiFailure

    return NextResponse.json({ error: 'Failed to generate weekly summary' }, { status: 500 })
  }
}

// GET - retrieve summaries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '4', 10)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 52)
      : 4

    // A specific week, so the UI can show an existing summary without
    // spending an AI call to (re)generate one.
    const weekOffsetParam = searchParams.get('weekOffset')
    if (weekOffsetParam !== null) {
      const weekOffset = Number.parseInt(weekOffsetParam, 10)
      if (!Number.isFinite(weekOffset)) {
        return NextResponse.json({ error: 'Invalid weekOffset' }, { status: 400 })
      }

      const { start: weekStart, end: weekEnd } = await userWeek(supabase, user.id, weekOffset)

      // The numbers are always the live ones; the reflection is read if it has been written
      const [stats, lastWeek, { data: days, error: daysError }, { data: summary }] = await Promise.all([
        weekStats(supabase, weekStart, weekEnd),
        weekStats(supabase, addDays(weekStart, -7), addDays(weekEnd, -7)),
        supabase.rpc('week_days', { p_week_start: weekStart, p_week_end: weekEnd }),
        supabase
          .from('weekly_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', weekStart)
          .maybeSingle(),
      ])
      if (daysError) throw new Error(`Could not compute the week's days: ${daysError.message}`)

      return NextResponse.json({
        success: true,
        week: { start: weekStart, end: weekEnd },
        stats: {
          ...stats,
          plan_completion_rate: planCompletionRate(stats.plan_steps, stats.plan_steps_done),
          completed_last_week: isEmptyWeek(lastWeek) ? null : lastWeek.items_completed,
          empty: isEmptyWeek(stats),
        },
        days: days ?? [],
        summary: summary ?? null,
      })
    }

    // Get recent summaries
    const { data: summaries } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(limit)

    return NextResponse.json({
      success: true,
      summaries: summaries ?? [],
    })

  } catch (error) {
    console.error('Get weekly summaries error:', error)
    return NextResponse.json(
      { error: 'Failed to get summaries' },
      { status: 500 }
    )
  }
}

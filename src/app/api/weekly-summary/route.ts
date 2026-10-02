import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { aiErrorResponse } from '@/lib/ai/http'
import { summarizeWeek } from '@/lib/ai/weekly-summary'
import { addDays, startOfDayIn, weekIn } from '@/lib/dates'

type Client = Awaited<ReturnType<typeof createClient>>

// Weeks are the user's weeks: Sunday to Saturday in their own timezone.
async function userTimeZone(supabase: Client, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).single()
  return data?.timezone ?? 'UTC'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weekOffset = 0 } = body // 0 = current week, -1 = last week

    const timeZone = await userTimeZone(supabase, user.id)
    const { start: weekStart, end: weekEnd } = weekIn(timeZone, new Date(), Number(weekOffset) || 0)
    // The same week as instants, for comparing against timestamps
    const weekStartsAt = startOfDayIn(timeZone, weekStart).toISOString()
    const weekEndsAt = startOfDayIn(timeZone, addDays(weekEnd, 1)).toISOString()

    // Check if summary already exists
    const { data: existingSummary } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        cached: true,
      })
    }

    // Checked only now: showing a summary that already exists costs nothing
    const refusal = await refuseAiCall(supabase, user.id)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    const startTime = Date.now()

    // Get items created this week
    const { count: itemsCreated } = await supabase
      .from('inbox_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekStartsAt)
      .lt('created_at', weekEndsAt)

    // Get completed items this week
    const { data: completedItems } = await supabase
      .from('inbox_items')
      .select(`
        content,
        completed_at,
        project_id,
        projects (name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', weekStartsAt)
      .lt('completed_at', weekEndsAt)

    // Get pending items (carried over)
    const { data: pendingItems } = await supabase
      .from('inbox_items')
      .select('content, priority, created_at')
      .eq('user_id', user.id)
      .in('status', ['inbox', 'organized', 'in_progress'])
      .lt('created_at', weekStartsAt) // Created before this week = carried over

    // Get daily plans for adherence calculation
    const { data: dailyPlans } = await supabase
      .from('daily_plans')
      .select('id, daily_plan_items ( inbox_items ( status ) )')
      .eq('user_id', user.id)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd)

    // Calculate plan adherence
    let planAdherence = 'No daily plans created'
    if (dailyPlans && dailyPlans.length > 0) {
      const steps = dailyPlans.flatMap((plan) => plan.daily_plan_items)
      const totalPlanned = steps.length
      const totalCompleted = steps.filter((step) => step.inbox_items.status === 'completed').length
      const adherenceRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
      planAdherence = `${dailyPlans.length} plans created, ${adherenceRate}% completion rate`
    }

    // Get projects touched
    const projectsTouched = new Set<string>()
    completedItems?.forEach(item => {
      if ((item.projects as unknown as { name: string } | null)?.name) {
        projectsTouched.add((item.projects as unknown as { name: string }).name)
      }
    })

    // Get last week's summary for comparison
    const lastWeekStart = addDays(weekStart, -7)

    const { data: lastWeekSummary } = await supabase
      .from('weekly_summaries')
      .select('summary_text, focus_score, productivity_trend')
      .eq('user_id', user.id)
      .eq('week_start', lastWeekStart)
      .single()

    const summary = await summarizeWeek({
      userId: user.id,
      weekStart,
      weekEnd,
      itemsCreated: itemsCreated || 0,
      itemsCompleted: completedItems?.length || 0,
      itemsCarriedOver: pendingItems?.length || 0,
      completedItems: (completedItems || []).map(item => ({
        content: item.content,
        project_name: (item.projects as unknown as { name: string } | null)?.name || null,
      })),
      pendingItems: (pendingItems || []).map(item => ({
        content: item.content,
        priority: item.priority,
        ageDays: Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86_400_000),
      })),
      planAdherence,
      projectsTouched: Array.from(projectsTouched),
      lastWeekSummary: lastWeekSummary
        ? `Score: ${lastWeekSummary.focus_score}, Trend: ${lastWeekSummary.productivity_trend}. ${lastWeekSummary.summary_text?.slice(0, 200)}`
        : null,
    })

    const latencyMs = Date.now() - startTime

    // Save the summary
    const { data: savedSummary } = await supabase
      .from('weekly_summaries')
      .insert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        items_created: itemsCreated || 0,
        items_completed: completedItems?.length || 0,
        items_carried_over: pendingItems?.length || 0,
        summary_text: summary.summary_text,
        accomplishments: summary.accomplishments,
        patterns: summary.patterns,
        suggestions: summary.suggestions,
        productivity_trend: summary.productivity_trend,
        focus_score: summary.focus_score,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      summary: savedSummary,
      aiSummary: summary,
      latencyMs,
    })

  } catch (error) {
    console.error('Weekly summary API error:', error)

    const aiFailure = aiErrorResponse(error)
    if (aiFailure) return aiFailure

    return NextResponse.json(
      { error: 'Failed to generate weekly summary' },
      { status: 500 }
    )
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

      const { start: weekStart } = weekIn(await userTimeZone(supabase, user.id), new Date(), weekOffset)

      const { data: summary } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle()

      return NextResponse.json({ success: true, summary: summary ?? null })
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

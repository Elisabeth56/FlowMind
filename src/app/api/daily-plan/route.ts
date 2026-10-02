import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { aiErrorResponse } from '@/lib/ai/http'
import { askAboutDay, planDay } from '@/lib/ai/plan-day'
import { AiError } from '@/lib/ai'
import { fallbackPlanSteps, loadDailyPlan, planStartTime, toPlanSteps, type PlanStep } from '@/lib/daily-plan'
import { safeTimeZone, startOfDayIn, todayIn } from '@/lib/dates'
import type { Json } from '@/types/models'

async function userToday(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).single()
  return todayIn(data?.timezone ?? 'UTC')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action = 'generate', question } = body

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const startTime = Date.now()

    // The user's own date: a server in UTC is a day behind Lagos for an hour every night
    const today = todayIn(profile.timezone)

    // Handle "ask" action - answer a question about the day
    if (action === 'ask' && question) {
      const todayPlan = await loadDailyPlan(supabase, user.id, today)

      const planSummary = todayPlan 
        ? `Focus: ${todayPlan.reasoning}\nItems planned: ${todayPlan.items_total}\nCompleted: ${todayPlan.items_completed}`
        : 'No plan generated for today yet.'

      const refusal = await refuseAiCall(supabase, user.id)
      if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

      const answer = await askAboutDay({ userId: user.id, today, planSummary, question })

      return NextResponse.json({
        success: true,
        answer,
        latencyMs: Date.now() - startTime,
      })
    }

    // Generate new daily plan, unless today already has one
    const existingPlan = await loadDailyPlan(supabase, user.id, today)

    if (existingPlan && action !== 'regenerate') {
      return NextResponse.json({
        success: true,
        plan: existingPlan,
        message: 'Plan already exists for today',
        cached: true,
      })
    }

    // Checked only now: showing a plan that already exists costs nothing
    const refusal = await refuseAiCall(supabase, user.id)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    // Get pending items
    const { data: pendingItems } = await supabase
      .from('inbox_items')
      .select(`
        id,
        content,
        priority,
        due_date,
        is_actionable,
        project_id,
        projects (name)
      `)
      .eq('user_id', user.id)
      .in('status', ['inbox', 'organized', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(20)

    // Get projects
    const { data: projects } = await supabase
      .from('projects')
      .select('name')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Get completed today count
    const { count: completedToday } = await supabase
      .from('inbox_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', startOfDayIn(profile.timezone, today).toISOString())

    const candidates = (pendingItems || []).map(item => ({
      id: item.id,
      content: item.content,
      priority: item.priority,
      due_date: item.due_date,
      project_name: (item.projects as unknown as { name: string } | null)?.name || null,
    }))

    // If no model answers, plan by rule instead of leaving the user without a day
    let degraded = false
    let plan: { reasoning: string; energy_recommendation: string; steps: PlanStep[] }
    try {
      const planned = await planDay({
        userId: user.id,
        items: candidates,
        projects: projects?.map(p => p.name) || [],
        timeZone: profile.timezone,
        preferredStart: profile.daily_plan_time,
        completedToday: completedToday || 0,
      })
      plan = {
        reasoning: planned.reasoning,
        energy_recommendation: planned.energy_recommendation,
        // The model may only schedule items we offered
        steps: toPlanSteps(planned.plan_items, candidates.map((item) => item.id)),
      }
    } catch (error) {
      if (!(error instanceof AiError) || error.kind !== 'unavailable') throw error
      degraded = true
      plan = {
        reasoning:
          'The AI is unavailable right now, so this plan is ordered by due date and priority. Regenerate it later for a reasoned one.',
        energy_recommendation: '',
        steps: fallbackPlanSteps(candidates, today, planStartTime(profile.daily_plan_time, safeTimeZone(profile.timezone))),
      }
    }

    const latencyMs = Date.now() - startTime

    // Plan and steps are written together
    const { error: saveError } = await supabase.rpc('save_daily_plan', {
      p_plan_date: today,
      p_reasoning: plan.reasoning,
      p_energy_recommendation: plan.energy_recommendation,
      p_items: plan.steps as unknown as Json,
    })
    if (saveError) throw new Error(`Could not save plan: ${saveError.message}`)

    return NextResponse.json({
      success: true,
      plan: await loadDailyPlan(supabase, user.id, today),
      degraded,
      latencyMs,
    })

  } catch (error) {
    console.error('Daily plan API error:', error)

    const aiFailure = aiErrorResponse(error)
    if (aiFailure) return aiFailure

    return NextResponse.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    )
  }
}

// GET - retrieve today's plan or ask "what should I focus on?"
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await loadDailyPlan(supabase, user.id, await userToday(supabase, user.id))

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        message: 'No plan for today. Generate one?',
      })
    }

    return NextResponse.json({
      success: true,
      plan,
    })

  } catch (error) {
    console.error('Get daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to get daily plan' },
      { status: 500 }
    )
  }
}

// PATCH - tick a plan item off (or back on)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, completed = true } = await request.json()
    if (typeof itemId !== 'string' || !itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    const { error: itemError } = await supabase
      .from('inbox_items')
      .update({
        status: completed ? 'completed' : 'organized',
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 400 })
    }

    // That one row is the whole change: the plan's progress is counted from its items
    return NextResponse.json({
      success: true,
      plan: await loadDailyPlan(supabase, user.id, await userToday(supabase, user.id)),
    })

  } catch (error) {
    console.error('Update daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update daily plan' },
      { status: 500 }
    )
  }
}

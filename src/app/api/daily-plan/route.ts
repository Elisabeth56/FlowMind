import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuota, quotaExceededBody, recordAiRun } from '@/lib/billing/quota'
import { getDailyPlanChain, getAnswerQuestionChain, type DailyPlan } from '@/lib/ai/chains/daily-plan'
import { MODELS, rateLimiter } from '@/lib/ai/groq'
import { loadDailyPlan, toPlanSteps } from '@/lib/daily-plan'
import { startOfDayIn, todayIn } from '@/lib/dates'
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

    const quota = await getQuota(supabase, user.id)
    if (!quota.allowed) {
      return NextResponse.json(quotaExceededBody(quota), { status: 429 })
    }

    await rateLimiter.acquire()
    const startTime = Date.now()

    // The user's own date: a server in UTC is a day behind Lagos for an hour every night
    const today = todayIn(profile.timezone)

    // Handle "ask" action - answer a question about the day
    if (action === 'ask' && question) {
      const todayPlan = await loadDailyPlan(supabase, user.id, today)

      const planSummary = todayPlan 
        ? `Focus: ${todayPlan.reasoning}\nItems planned: ${todayPlan.items_total}\nCompleted: ${todayPlan.items_completed}`
        : 'No plan generated for today yet.'

      const answer = await getAnswerQuestionChain().invoke({ planSummary, question })

      await recordAiRun({
        userId: user.id,
        operation: 'ask',
        model: MODELS.LLAMA_70B,
        latencyMs: Date.now() - startTime,
      })

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

    // Format items for the chain
    const formattedItems = (pendingItems || []).map(item => ({
      id: item.id,
      content: item.content,
      priority: item.priority,
      due_date: item.due_date,
      project_name: (item.projects as unknown as { name: string } | null)?.name || null,
      is_actionable: item.is_actionable,
    }))

    // Generate the plan
    const plan: DailyPlan = await getDailyPlanChain().invoke({
      items: formattedItems,
      projects: projects?.map(p => p.name) || [],
      timezone: profile.timezone,
      preferredStart: profile.daily_plan_time,
      completedToday: completedToday || 0,
    })

    const latencyMs = Date.now() - startTime

    // Plan and steps are written together; the model may only schedule items we offered
    const steps = toPlanSteps(plan.plan_items, formattedItems.map((item) => item.id))
    const { error: saveError } = await supabase.rpc('save_daily_plan', {
      p_plan_date: today,
      p_reasoning: plan.reasoning,
      p_energy_recommendation: plan.energy_recommendation,
      p_items: steps as unknown as Json,
    })
    if (saveError) throw new Error(`Could not save plan: ${saveError.message}`)

    await recordAiRun({
      userId: user.id,
      operation: 'daily_plan',
      model: MODELS.LLAMA_70B,
      latencyMs,
    })

    return NextResponse.json({
      success: true,
      plan: await loadDailyPlan(supabase, user.id, today),
      latencyMs,
    })

  } catch (error) {
    console.error('Daily plan API error:', error)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await recordAiRun({
        userId: user.id,
        operation: 'daily_plan',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

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

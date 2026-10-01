import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuota, quotaExceededBody, recordAiRun } from '@/lib/billing/quota'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getDailyPlanChain, getAnswerQuestionChain, type DailyPlan } from '@/lib/ai/chains/daily-plan'
import { MODELS, rateLimiter } from '@/lib/ai/groq'
import type { Database, DailyPlan as DailyPlanRow } from '@/types/models'

type PlanItem = {
  item_id: string
  scheduled_time: string
  duration_minutes: number
  notes: string
}

/**
 * Plans store only item ids, so every response has to join the inbox items
 * back in — otherwise the UI has nothing to render but "Task 1", "Task 2".
 */
async function enrichPlan(
  supabase: SupabaseClient<Database>,
  plan: DailyPlanRow
) {
  const planItems = (plan.plan_items as unknown as PlanItem[]) ?? []
  if (planItems.length === 0) return { ...plan, plan_items: [] }

  const { data: items } = await supabase
    .from('inbox_items')
    .select('id, content, status, priority, project_id')
    .in('id', planItems.map((p) => p.item_id))

  return {
    ...plan,
    plan_items: planItems.map((planItem) => ({
      ...planItem,
      item: items?.find((i) => i.id === planItem.item_id) || null,
    })),
  }
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

    // Handle "ask" action - answer a question about the day
    if (action === 'ask' && question) {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's plan
      const { data: todayPlan } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .single()

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

    // Generate new daily plan
    const today = new Date().toISOString().split('T')[0]

    // Check if plan already exists for today
    const { data: existingPlan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .single()

    if (existingPlan && action !== 'regenerate') {
      return NextResponse.json({
        success: true,
        plan: await enrichPlan(supabase, existingPlan),
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
      .gte('completed_at', today)

    // Format items for the chain
    const formattedItems = (pendingItems || []).map(item => ({
      id: item.id,
      content: item.content,
      priority: item.priority ?? 0,
      due_date: item.due_date,
      project_name: (item.projects as unknown as { name: string } | null)?.name || null,
      is_actionable: item.is_actionable ?? false,
    }))

    // Generate the plan
    const plan: DailyPlan = await getDailyPlanChain().invoke({
      items: formattedItems,
      projects: projects?.map(p => p.name) || [],
      timezone: profile.timezone ?? 'UTC',
      preferredStart: profile.daily_plan_time ?? '08:00',
      completedToday: completedToday || 0,
    })

    const latencyMs = Date.now() - startTime

    // Save the plan
    const planData = {
      user_id: user.id,
      plan_date: today,
      reasoning: plan.reasoning,
      energy_recommendation: plan.energy_recommendation,
      plan_items: plan.plan_items,
      items_total: plan.plan_items.length,
      items_completed: 0,
      status: 'active' as const,
    }

    let savedPlan
    if (existingPlan) {
      // Update existing plan
      const { data } = await supabase
        .from('daily_plans')
        .update(planData)
        .eq('id', existingPlan.id)
        .select()
        .single()
      savedPlan = data
    } else {
      // Insert new plan
      const { data } = await supabase
        .from('daily_plans')
        .insert(planData)
        .select()
        .single()
      savedPlan = data
    }

    await recordAiRun({
      userId: user.id,
      operation: 'daily_plan',
      model: MODELS.LLAMA_70B,
      latencyMs,
    })

    return NextResponse.json({
      success: true,
      plan: savedPlan ? await enrichPlan(supabase, savedPlan) : null,
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

    const today = new Date().toISOString().split('T')[0]

    // Get today's plan
    const { data: plan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .single()

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        message: 'No plan for today. Generate one?',
      })
    }

    return NextResponse.json({
      success: true,
      plan: await enrichPlan(supabase, plan),
    })

  } catch (error) {
    console.error('Get daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to get daily plan' },
      { status: 500 }
    )
  }
}

// PATCH - tick a plan item off (or back on) and keep the plan's counters in sync
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

    const today = new Date().toISOString().split('T')[0]
    const { data: plan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .single()

    if (!plan) {
      return NextResponse.json({ success: true, plan: null })
    }

    // Recount from the items themselves rather than nudging a stored number,
    // so the progress bar cannot drift out of sync with reality.
    const planItems = (plan.plan_items as unknown as PlanItem[]) ?? []
    let itemsCompleted = 0
    if (planItems.length > 0) {
      const { count } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('id', planItems.map((p) => p.item_id))
      itemsCompleted = count ?? 0
    }
    const { data: updatedPlan } = await supabase
      .from('daily_plans')
      .update({
        items_completed: itemsCompleted,
        status:
          planItems.length > 0 && itemsCompleted >= planItems.length
            ? ('completed' as const)
            : ('active' as const),
      })
      .eq('id', plan.id)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      plan: updatedPlan ? await enrichPlan(supabase, updatedPlan) : null,
    })

  } catch (error) {
    console.error('Update daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update daily plan' },
      { status: 500 }
    )
  }
}

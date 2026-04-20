import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dailyPlanChain, answerQuestionChain, type DailyPlan } from '@/lib/ai/chains/daily-plan'
import { rateLimiter } from '@/lib/ai/groq'

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

    // Check free tier limits
    const FREE_TIER_LIMIT = 50
    if (profile.subscription_tier === 'free' && profile.ai_calls_this_month >= FREE_TIER_LIMIT) {
      return NextResponse.json({ 
        error: 'Free tier limit reached',
        limit: FREE_TIER_LIMIT,
        used: profile.ai_calls_this_month,
      }, { status: 429 })
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

      const answer = await answerQuestionChain.invoke({ planSummary, question })

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
      .gte('completed_at', today)

    // Format items for the chain
    const formattedItems = (pendingItems || []).map(item => ({
      id: item.id,
      content: item.content,
      priority: item.priority,
      due_date: item.due_date,
      project_name: (item.projects as { name: string } | null)?.name || null,
      is_actionable: item.is_actionable,
    }))

    // Generate the plan
    const plan: DailyPlan = await dailyPlanChain.invoke({
      items: formattedItems,
      projects: projects?.map(p => p.name) || [],
      timezone: profile.timezone,
      preferredStart: profile.daily_plan_time,
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

    // Log the operation
    await supabase.from('ai_processing_log').insert({
      user_id: user.id,
      operation_type: 'daily_plan',
      model_used: 'llama-3.1-70b-versatile',
      latency_ms: latencyMs,
      success: true,
    })

    // Increment AI call counter
    await supabase
      .from('profiles')
      .update({ ai_calls_this_month: profile.ai_calls_this_month + 1 })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      aiPlan: plan,
      latencyMs,
    })

  } catch (error) {
    console.error('Daily plan API error:', error)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('ai_processing_log').insert({
        user_id: user.id,
        operation_type: 'daily_plan',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    )
  }
}

// GET - retrieve today's plan or ask "what should I focus on?"
export async function GET(request: NextRequest) {
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

    // Get the actual items referenced in the plan
    const itemIds = (plan.plan_items as Array<{ item_id: string }>).map(p => p.item_id)
    
    const { data: items } = await supabase
      .from('inbox_items')
      .select('id, content, status, priority, project_id')
      .in('id', itemIds)

    // Merge item data with plan
    const enrichedPlan = {
      ...plan,
      plan_items: (plan.plan_items as Array<{ item_id: string; scheduled_time: string; duration_minutes: number; notes: string }>).map(planItem => {
        const item = items?.find(i => i.id === planItem.item_id)
        return {
          ...planItem,
          item: item || null,
        }
      }),
    }

    return NextResponse.json({
      success: true,
      plan: enrichedPlan,
    })

  } catch (error) {
    console.error('Get daily plan error:', error)
    return NextResponse.json(
      { error: 'Failed to get daily plan' },
      { status: 500 }
    )
  }
}

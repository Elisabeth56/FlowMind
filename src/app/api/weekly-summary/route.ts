import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { weeklySummaryChain, type WeeklySummary } from '@/lib/ai/chains/weekly-summary'
import { rateLimiter } from '@/lib/ai/groq'

// Helper to get week boundaries
function getWeekBounds(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day // Adjust to Sunday
  
  const start = new Date(d)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
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

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check free tier
    const FREE_TIER_LIMIT = 50
    if (profile.subscription_tier === 'free' && profile.ai_calls_this_month >= FREE_TIER_LIMIT) {
      return NextResponse.json({ 
        error: 'Free tier limit reached',
        limit: FREE_TIER_LIMIT,
        used: profile.ai_calls_this_month,
      }, { status: 429 })
    }

    // Calculate week bounds
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7))
    const { start: weekStart, end: weekEnd } = getWeekBounds(targetDate)

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

    await rateLimiter.acquire()
    const startTime = Date.now()

    // Get items created this week
    const { data: createdItems, count: itemsCreated } = await supabase
      .from('inbox_items')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd + 'T23:59:59')

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
      .gte('completed_at', weekStart)
      .lte('completed_at', weekEnd + 'T23:59:59')

    // Get pending items (carried over)
    const { data: pendingItems } = await supabase
      .from('inbox_items')
      .select('content, priority, created_at')
      .eq('user_id', user.id)
      .in('status', ['inbox', 'organized', 'in_progress'])
      .lt('created_at', weekStart) // Created before this week = carried over

    // Get daily plans for adherence calculation
    const { data: dailyPlans } = await supabase
      .from('daily_plans')
      .select('items_completed, items_total, status')
      .eq('user_id', user.id)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd)

    // Calculate plan adherence
    let planAdherence = 'No daily plans created'
    if (dailyPlans && dailyPlans.length > 0) {
      const totalPlanned = dailyPlans.reduce((sum, p) => sum + p.items_total, 0)
      const totalCompleted = dailyPlans.reduce((sum, p) => sum + p.items_completed, 0)
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
    const lastWeekDate = new Date(targetDate)
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)
    const { start: lastWeekStart } = getWeekBounds(lastWeekDate)
    
    const { data: lastWeekSummary } = await supabase
      .from('weekly_summaries')
      .select('summary_text, focus_score, productivity_trend')
      .eq('user_id', user.id)
      .eq('week_start', lastWeekStart)
      .single()

    // Generate summary
    const summary: WeeklySummary = await weeklySummaryChain.invoke({
      weekStart,
      weekEnd,
      itemsCreated: itemsCreated || 0,
      itemsCompleted: completedItems?.length || 0,
      itemsCarriedOver: pendingItems?.length || 0,
      completedItems: (completedItems || []).map(item => ({
        content: item.content,
        project_name: (item.projects as unknown as { name: string } | null)?.name || null,
        completed_at: item.completed_at!,
      })),
      pendingItems: (pendingItems || []).map(item => ({
        content: item.content,
        priority: item.priority,
        created_at: item.created_at,
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

    // Log the operation
    await supabase.from('ai_processing_log').insert({
      user_id: user.id,
      operation_type: 'weekly_summary',
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
      summary: savedSummary,
      aiSummary: summary,
      latencyMs,
    })

  } catch (error) {
    console.error('Weekly summary API error:', error)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('ai_processing_log').insert({
        user_id: user.id,
        operation_type: 'weekly_summary',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

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
    const limit = parseInt(searchParams.get('limit') || '4')

    // Get recent summaries
    const { data: summaries } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(limit)

    return NextResponse.json({
      success: true,
      summaries,
    })

  } catch (error) {
    console.error('Get weekly summaries error:', error)
    return NextResponse.json(
      { error: 'Failed to get summaries' },
      { status: 500 }
    )
  }
}

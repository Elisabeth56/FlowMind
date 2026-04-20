import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { organizeChain, organizeItems, type OrganizedItem } from '@/lib/ai/chains/organize'
import { rateLimiter } from '@/lib/ai/groq'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { itemIds, content } = body

    // Check rate limit and subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, ai_calls_this_month, ai_calls_reset_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check free tier limits (50 AI calls per month)
    const FREE_TIER_LIMIT = 50
    if (profile.subscription_tier === 'free') {
      // Reset counter if new month
      const resetDate = new Date(profile.ai_calls_reset_at)
      const now = new Date()
      if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
        await supabase
          .from('profiles')
          .update({ ai_calls_this_month: 0, ai_calls_reset_at: now.toISOString() })
          .eq('id', user.id)
        profile.ai_calls_this_month = 0
      }

      if (profile.ai_calls_this_month >= FREE_TIER_LIMIT) {
        return NextResponse.json({ 
          error: 'Free tier limit reached',
          limit: FREE_TIER_LIMIT,
          used: profile.ai_calls_this_month,
        }, { status: 429 })
      }
    }

    // Get existing projects for context
    const { data: projects } = await supabase
      .from('projects')
      .select('name')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const existingProjects = projects?.map(p => p.name) || []

    // Rate limit
    await rateLimiter.acquire()

    const startTime = Date.now()
    let result: OrganizedItem | Map<string, OrganizedItem>
    let itemCount = 1

    // Single item or batch
    if (content) {
      // Single new item - organize it
      result = await organizeChain.invoke({ content, existingProjects })
    } else if (itemIds && Array.isArray(itemIds)) {
      // Batch organize existing items
      const { data: items } = await supabase
        .from('inbox_items')
        .select('id, content')
        .in('id', itemIds)
        .eq('user_id', user.id)

      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'No items found' }, { status: 404 })
      }

      itemCount = items.length
      result = await organizeItems(items, existingProjects)
    } else {
      return NextResponse.json({ error: 'Provide either content or itemIds' }, { status: 400 })
    }

    const latencyMs = Date.now() - startTime

    // Log the AI operation
    await supabase.from('ai_processing_log').insert({
      user_id: user.id,
      operation_type: 'organize',
      model_used: 'llama-3.1-8b-instant',
      latency_ms: latencyMs,
      success: true,
    })

    // Increment AI call counter
    await supabase
      .from('profiles')
      .update({ ai_calls_this_month: profile.ai_calls_this_month + itemCount })
      .eq('id', user.id)

    // If batch, update the items in the database
    if (result instanceof Map) {
      const updates = Array.from(result.entries()).map(([id, organized]) => ({
        id,
        item_type: organized.item_type,
        is_actionable: organized.is_actionable,
        priority: organized.priority,
        sentiment: organized.sentiment,
        extracted_entities: organized.extracted_entities,
        extracted_topics: organized.extracted_topics,
        due_date: organized.due_date,
        status: 'organized' as const,
        organized_at: new Date().toISOString(),
      }))

      // Update each item
      for (const update of updates) {
        await supabase
          .from('inbox_items')
          .update(update)
          .eq('id', update.id)
      }

      // Create suggested projects if they don't exist
      const suggestedProjects = new Set<string>()
      result.forEach(org => {
        if (org.suggested_project && !existingProjects.includes(org.suggested_project)) {
          suggestedProjects.add(org.suggested_project)
        }
      })

      if (suggestedProjects.size > 0) {
        const newProjects = Array.from(suggestedProjects).map(name => ({
          user_id: user.id,
          name,
          suggested_by_ai: true,
          ai_confidence: 0.8,
        }))
        
        await supabase.from('projects').insert(newProjects)
      }

      return NextResponse.json({
        success: true,
        organized: Object.fromEntries(result),
        itemsProcessed: result.size,
        newProjectsSuggested: Array.from(suggestedProjects),
        latencyMs,
      })
    }

    // Single item result
    return NextResponse.json({
      success: true,
      organized: result,
      latencyMs,
    })

  } catch (error) {
    console.error('Organize API error:', error)
    
    // Log the failure
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('ai_processing_log').insert({
        user_id: user.id,
        operation_type: 'organize',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      { error: 'Failed to organize items' },
      { status: 500 }
    )
  }
}

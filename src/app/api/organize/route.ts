import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuota, quotaExceededBody, recordAiRun } from '@/lib/billing/quota'
import { getOrganizeChain, organizeItems, type OrganizedItem } from '@/lib/ai/chains/organize'
import { MODELS, rateLimiter } from '@/lib/ai/groq'

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

    // What this request costs against the free quota: one unit per item
    const cost = Array.isArray(itemIds) && !content ? Math.max(1, itemIds.length) : 1
    const quota = await getQuota(supabase, user.id, cost)
    if (!quota.allowed) {
      return NextResponse.json(quotaExceededBody(quota), { status: 429 })
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
      result = await getOrganizeChain().invoke({ content, existingProjects })
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

    await recordAiRun({
      userId: user.id,
      operation: 'organize',
      units: itemCount,
      model: MODELS.LLAMA_8B,
      latencyMs,
    })

    // If batch, update the items in the database
    if (result instanceof Map) {
      const updates = Array.from(result.entries()).map(([id, organized]) => ({
        id,
        item_type: organized.item_type,
        is_actionable: organized.is_actionable,
        priority: organized.priority,
        sentiment: organized.sentiment,
        extracted_entities: organized.extracted_entities,
        tags: [...new Set(organized.extracted_topics.map((topic) => topic.trim().toLowerCase()).filter(Boolean))],
        ai_status: 'done',
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
      // Project names are unique per user whatever the case, so "Clients" and "clients" are one
      const known = new Set(existingProjects.map((name) => name.toLowerCase()))
      const suggestedProjects = new Set<string>()
      result.forEach(org => {
        const name = org.suggested_project?.trim()
        if (name && !known.has(name.toLowerCase())) {
          known.add(name.toLowerCase())
          suggestedProjects.add(name)
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
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await recordAiRun({
        userId: user.id,
        operation: 'organize',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      { error: 'Failed to organize items' },
      { status: 500 }
    )
  }
}

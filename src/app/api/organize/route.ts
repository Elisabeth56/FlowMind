import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { refuseAiCall } from '@/lib/billing/quota'
import { cleanTags, organizeItems, type OrganizedItem } from '@/lib/ai/organize'
import { todayIn } from '@/lib/dates'

const bodySchema = z.object({ itemIds: z.array(z.uuid()).min(1).max(50) })

// POST - organise existing inbox items: type, priority, tags, due date, project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = bodySchema.safeParse(await request.json().catch(() => null))
    if (!body.success) {
      return NextResponse.json({ error: 'Provide itemIds: 1 to 50 item ids' }, { status: 400 })
    }

    const [{ data: items }, { data: projects }, { data: profile }] = await Promise.all([
      supabase.from('inbox_items').select('id, content').in('id', body.data.itemIds).eq('user_id', user.id),
      supabase.from('projects').select('id, name').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('timezone').eq('id', user.id).single(),
    ])
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 404 })
    }

    // One unit of quota per item
    const refusal = await refuseAiCall(supabase, user.id, items.length)
    if (refusal) return NextResponse.json(refusal.body, { status: refusal.status })

    const startTime = Date.now()
    const results = await organizeItems(items, {
      userId: user.id,
      existingProjects: (projects ?? []).map((project) => project.name),
      today: todayIn(profile?.timezone ?? 'UTC'),
    })

    // Project names are unique per user whatever the case, so "Clients" and "clients" are one
    const projectIds = new Map((projects ?? []).map((project) => [project.name.toLowerCase(), project.id]))
    const newNames = new Map<string, string>()
    for (const organized of results.values()) {
      const name = organized?.suggested_project?.trim()
      if (name && !projectIds.has(name.toLowerCase())) newNames.set(name.toLowerCase(), name)
    }
    if (newNames.size > 0) {
      const { data: created } = await supabase
        .from('projects')
        .insert([...newNames.values()].map((name) => ({ user_id: user.id, name, suggested_by_ai: true })))
        .select('id, name')
      for (const project of created ?? []) projectIds.set(project.name.toLowerCase(), project.id)
    }

    const organizedAt = new Date().toISOString()
    const organizedItems: Record<string, OrganizedItem> = {}
    await Promise.all(
      [...results].map(([id, organized]) => {
        // The model could not handle this one: say so on the item, so the inbox can offer a retry
        if (!organized) {
          return supabase.from('inbox_items').update({ ai_status: 'failed' }).eq('id', id)
        }
        organizedItems[id] = organized
        const projectId = organized.suggested_project
          ? projectIds.get(organized.suggested_project.trim().toLowerCase())
          : undefined
        return supabase
          .from('inbox_items')
          .update({
            item_type: organized.item_type,
            is_actionable: organized.is_actionable,
            priority: organized.priority,
            sentiment: organized.sentiment,
            extracted_entities: organized.entities,
            tags: cleanTags(organized.tags),
            due_date: organized.due_date,
            ...(projectId ? { project_id: projectId } : {}),
            status: 'organized',
            ai_status: 'done',
            organized_at: organizedAt,
          })
          .eq('id', id)
      })
    )

    return NextResponse.json({
      success: true,
      organized: organizedItems,
      itemsProcessed: Object.keys(organizedItems).length,
      itemsFailed: results.size - Object.keys(organizedItems).length,
      newProjectsSuggested: [...newNames.values()],
      latencyMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Organize API error:', error)
    return NextResponse.json({ error: 'Failed to organize items' }, { status: 500 })
  }
}

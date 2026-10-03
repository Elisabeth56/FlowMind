// Organise: one structured call per captured item, on the small fast model.
import { z } from 'zod'
import { generate, type CallOverrides } from './index'

const organizedItemSchema = z.object({
  item_type: z.enum(['note', 'task', 'idea', 'reminder', 'link']),
  is_actionable: z.boolean(),
  priority: z.number().int().min(0).max(3),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']),
  entities: z.array(
    z.object({
      type: z.enum(['person', 'date', 'time', 'place', 'project', 'deadline', 'amount']),
      value: z.string(),
    })
  ),
  tags: z.array(z.string()).max(6),
  suggested_project: z.string().nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  summary: z.string(),
})

export type OrganizedItem = z.infer<typeof organizedItemSchema>

type Context = { userId: string; existingProjects: string[]; today: string }

export function organizeItem(
  content: string,
  context: Context,
  overrides: CallOverrides = {}
): Promise<OrganizedItem> {
  return generate({
    ...overrides,
    prompt: 'organize',
    tier: 'fast',
    schema: organizedItemSchema,
    variables: {
      today: context.today,
      weekday: new Date(`${context.today}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
      existing_projects: context.existingProjects.join(', ') || 'none yet',
      content,
    },
    run: { userId: context.userId, operation: 'organize' },
  })
}

/** Organises several items, five at a time. An item the model could not handle maps to null. */
export async function organizeItems(
  items: { id: string; content: string }[],
  context: Context
): Promise<Map<string, OrganizedItem | null>> {
  const results = new Map<string, OrganizedItem | null>()
  for (let i = 0; i < items.length; i += 5) {
    await Promise.all(
      items.slice(i, i + 5).map(async (item) => {
        results.set(item.id, await organizeItem(item.content, context).catch(() => null))
      })
    )
  }
  return results
}

/**
 * Project names the model suggested that the user does not have yet. Names are compared
 * without case, so "clients" and "Clients" are one project; the first spelling wins.
 */
export function newProjectNames(
  results: Iterable<OrganizedItem | null>,
  existingNames: string[]
): string[] {
  const known = new Set(existingNames.map((name) => name.toLowerCase()))
  const fresh: string[] = []
  for (const organized of results) {
    const name = organized?.suggested_project?.trim()
    if (!name || known.has(name.toLowerCase())) continue
    known.add(name.toLowerCase())
    fresh.push(name)
  }
  return fresh
}

/** The single update that files an item: its kind, priority, date, tags and project. */
export function toItemUpdate(organized: OrganizedItem, projectId: string | undefined, organizedAt: string) {
  return {
    item_type: organized.item_type,
    is_actionable: organized.is_actionable,
    priority: organized.priority,
    sentiment: organized.sentiment,
    extracted_entities: organized.entities,
    tags: cleanTags(organized.tags),
    due_date: organized.due_date,
    // An item keeps the project it has when the model suggests none
    ...(projectId ? { project_id: projectId } : {}),
    status: 'organized',
    ai_status: 'done',
    organized_at: organizedAt,
  }
}

/** Lowercase, trimmed, no blanks or repeats: the form tags are stored in. */
export function cleanTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}

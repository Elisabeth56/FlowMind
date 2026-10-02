// Organise: one structured call per captured item, on the small fast model.
import { z } from 'zod'
import { generate } from './index'

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

export function organizeItem(content: string, context: Context): Promise<OrganizedItem> {
  return generate({
    prompt: 'organize',
    tier: 'fast',
    schema: organizedItemSchema,
    variables: {
      today: context.today,
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

/** Lowercase, trimmed, no blanks or repeats: the form tags are stored in. */
export function cleanTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}

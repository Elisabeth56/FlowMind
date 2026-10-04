// Weekly reflection: one structured call. Every number is computed before the call
// (see week_stats() and src/lib/weekly.ts); the model only writes about them.
import { z } from 'zod'
import { generate } from './index'

const weeklySummarySchema = z.object({
  summary_text: z.string(),
  accomplishments: z.array(z.string()).max(5),
  keep: z.string(),
  try_next: z.string(),
})

export type WrittenSummary = z.infer<typeof weeklySummarySchema>

const PRIORITY = ['none', 'low', 'medium', 'high']

export function summarizeWeek(input: {
  userId: string
  weekStart: string
  weekEnd: string
  itemsCreated: number
  itemsCompleted: number
  itemsCarriedOver: number
  completionRate: number
  planCompletionRate: number | null
  trend: string
  projects: Array<{ name: string; completed: number }>
  completedItems: Array<{ content: string; project_name: string | null }>
  pendingItems: Array<{ content: string; priority: number; ageDays: number }>
}): Promise<WrittenSummary> {
  return generate({
    prompt: 'weekly-summary',
    tier: 'smart',
    schema: weeklySummarySchema,
    variables: {
      week_start: input.weekStart,
      week_end: input.weekEnd,
      items_created: input.itemsCreated,
      items_completed: input.itemsCompleted,
      items_carried_over: input.itemsCarriedOver,
      completion_rate: input.completionRate,
      plan_adherence:
        input.planCompletionRate === null
          ? 'no daily plans this week'
          : `${input.planCompletionRate}% of planned steps done`,
      projects: input.projects.map((project) => `${project.name} ${project.completed}`).join(', ') || 'none',
      trend: input.trend,
      completed_items:
        input.completedItems
          .map((item) => `- ${item.content}${item.project_name ? ` (${item.project_name})` : ''}`)
          .join('\n') || 'Nothing completed this week',
      pending_items:
        input.pendingItems
          .map((item) => `- ${item.content} (priority ${PRIORITY[item.priority] ?? 'none'}, ${item.ageDays} days old)`)
          .join('\n') || 'Nothing carried over',
    },
    run: { userId: input.userId, operation: 'weekly_summary' },
  })
}

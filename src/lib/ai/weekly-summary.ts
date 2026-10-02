// Weekly summary: one structured call around numbers the database already computed.
import { z } from 'zod'
import { generate } from './index'

const weeklySummarySchema = z.object({
  summary_text: z.string(),
  accomplishments: z.array(z.string()),
  patterns: z.array(
    z.object({
      pattern: z.string(),
      type: z.enum(['positive', 'neutral', 'negative']),
      evidence: z.string(),
    })
  ),
  suggestions: z.array(
    z.object({
      suggestion: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      effort: z.enum(['quick', 'moderate', 'significant']),
    })
  ),
  productivity_trend: z.enum(['improving', 'stable', 'declining']),
  focus_score: z.number().min(0).max(100),
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
  completedItems: Array<{ content: string; project_name: string | null }>
  pendingItems: Array<{ content: string; priority: number; ageDays: number }>
  planAdherence: string
  projectsTouched: string[]
  lastWeekSummary: string | null
}): Promise<WrittenSummary> {
  const total = input.itemsCreated + input.itemsCarriedOver
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
      // Computed here so the model never does arithmetic
      completion_rate: total === 0 ? 0 : Math.round((input.itemsCompleted / total) * 100),
      plan_adherence: input.planAdherence,
      projects_touched: input.projectsTouched.join(', ') || 'none',
      completed_items:
        input.completedItems
          .map((item) => `- ${item.content}${item.project_name ? ` (${item.project_name})` : ''}`)
          .join('\n') || 'Nothing completed this week',
      pending_items:
        input.pendingItems
          .map((item) => `- ${item.content} (priority ${PRIORITY[item.priority] ?? 'none'}, ${item.ageDays} days old)`)
          .join('\n') || 'Nothing carried over',
      last_week_summary: input.lastWeekSummary ?? 'No summary for last week',
    },
    run: { userId: input.userId, operation: 'weekly_summary' },
  })
}

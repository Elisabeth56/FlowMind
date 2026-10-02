// Daily plan: one structured call over the user's open items, on the larger model.
import { z } from 'zod'
import { safeTimeZone, todayIn } from '@/lib/dates'
import { collect, generate, stream } from './index'

const dailyPlanSchema = z.object({
  reasoning: z.string(),
  energy_recommendation: z.string(),
  plan_items: z.array(
    z.object({
      item_id: z.string(),
      scheduled_time: z.string(),
      duration_minutes: z.number(),
      why_now: z.string(),
    })
  ),
})

export type PlannedDay = z.infer<typeof dailyPlanSchema>

export type PlanCandidate = {
  id: string
  content: string
  priority: number
  due_date: string | null
  project_name: string | null
}

const PRIORITY = ['none', 'low', 'medium', 'high']

function formatCandidates(items: PlanCandidate[]): string {
  if (items.length === 0) return 'No open items'
  return items
    .map((item) => {
      const due = item.due_date ? `, due ${item.due_date}` : ''
      const project = item.project_name ? `, project ${item.project_name}` : ''
      return `- id ${item.id}: ${item.content} (priority ${PRIORITY[item.priority] ?? 'none'}${due}${project})`
    })
    .join('\n')
}

export function planDay(input: {
  userId: string
  items: PlanCandidate[]
  projects: string[]
  timeZone: string
  preferredStart: string
  completedToday: number
}): Promise<PlannedDay> {
  const zone = safeTimeZone(input.timeZone)
  const now = new Date()
  return generate({
    prompt: 'daily-plan',
    tier: 'smart',
    schema: dailyPlanSchema,
    variables: {
      // The user's date and clock, not the server's
      today: todayIn(zone, now),
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: zone }),
      current_time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zone }),
      preferred_start: input.preferredStart.slice(0, 5),
      completed_today: input.completedToday,
      projects: input.projects.join(', ') || 'none yet',
      items: formatCandidates(input.items),
    },
    run: { userId: input.userId, operation: 'daily_plan' },
  })
}

/** Answers a question about today's plan. */
export async function askAboutDay(input: {
  userId: string
  today: string
  planSummary: string
  question: string
}): Promise<string> {
  const text = await stream({
    prompt: 'ask',
    tier: 'smart',
    variables: { today: input.today, plan_summary: input.planSummary, question: input.question },
    run: { userId: input.userId, operation: 'ask' },
  })
  return collect(text)
}

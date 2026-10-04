// Daily plan: one structured call over the user's open items, on the larger model.
import { z } from 'zod'
import { safeTimeZone, todayIn } from '@/lib/dates'
import { collect, generate, generateStream, stream, type CallOverrides } from './index'

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

// Whether something is overdue is decided here, not left to the model to work out
function formatCandidates(items: PlanCandidate[], today: string): string {
  if (items.length === 0) return 'No open items'
  return items
    .map((item) => {
      const urgency = !item.due_date || item.due_date > today ? '' : item.due_date === today ? ' DUE TODAY' : ' OVERDUE'
      const due = item.due_date ? `, due ${item.due_date}${urgency}` : ''
      const project = item.project_name ? `, project ${item.project_name}` : ''
      return `- id ${item.id}: ${item.content} (priority ${PRIORITY[item.priority] ?? 'none'}${due}${project})`
    })
    .join('\n')
}

type PlanInput = {
  userId: string
  items: PlanCandidate[]
  projects: string[]
  timeZone: string
  preferredStart: string
  completedToday: number
  /** The moment being planned from. Defaults to now; the evals fix it. */
  now?: Date
}

function planCall(input: PlanInput) {
  const zone = safeTimeZone(input.timeZone)
  const now = input.now ?? new Date()
  return {
    prompt: 'daily-plan' as const,
    tier: 'smart' as const,
    schema: dailyPlanSchema,
    variables: {
      // The user's date and clock, not the server's
      today: todayIn(zone, now),
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: zone }),
      current_time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zone }),
      preferred_start: input.preferredStart.slice(0, 5),
      completed_today: input.completedToday,
      projects: input.projects.join(', ') || 'none yet',
      items: formatCandidates(input.items, todayIn(zone, now)),
    },
    run: { userId: input.userId, operation: 'daily_plan' as const },
  }
}

/** The plan in one piece, with a retry if the model's answer is malformed. */
export function planDay(input: PlanInput, overrides: CallOverrides = {}): Promise<PlannedDay> {
  return generate({ ...planCall(input), ...overrides })
}

/** The plan as it is written, for showing on screen while the model works. */
export function planDayStream(input: PlanInput) {
  return generateStream(planCall(input))
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

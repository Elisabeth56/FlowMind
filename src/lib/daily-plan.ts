// Reading and shaping daily plans. A plan is a row in `daily_plans` plus ordered
// steps in `daily_plan_items`; a step is done when its inbox item is done.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/models'

type Client = SupabaseClient<Database>

export type PlanStep = {
  item_id: string
  scheduled_time: string | null
  duration_minutes: number | null
  why: string | null
}

/** "9:00", "09:00:00" and "09:00" all become "09:00"; anything else is no time at all. */
export function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/)
  if (!match || Number(match[1]) > 23) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

/**
 * Turns the model's suggested steps into rows we can store. The model is only allowed
 * to schedule items we offered it: an id it invented, or repeated, is dropped.
 */
export function toPlanSteps(
  suggested: Array<{ item_id: string; scheduled_time?: unknown; duration_minutes?: unknown; why_now?: string; notes?: string }>,
  candidateIds: string[]
): PlanStep[] {
  const allowed = new Set(candidateIds)
  const steps: PlanStep[] = []
  for (const step of suggested) {
    if (!allowed.delete(step.item_id)) continue
    const minutes = Number(step.duration_minutes)
    steps.push({
      item_id: step.item_id,
      scheduled_time: normalizeTime(step.scheduled_time),
      duration_minutes: Number.isInteger(minutes) && minutes > 0 ? minutes : null,
      why: step.why_now || step.notes || null,
    })
  }
  return steps
}

/** The plan for one date with its steps and their items, in the shape the Today screen reads. */
export async function loadDailyPlan(supabase: Client, userId: string, date: string) {
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select(
      `id, plan_date, reasoning, energy_recommendation,
       daily_plan_items (
         item_id, position, scheduled_time, duration_minutes, why,
         inbox_items ( id, content, status, priority, project_id )
       )`
    )
    .eq('user_id', userId)
    .eq('plan_date', date)
    .order('position', { referencedTable: 'daily_plan_items' })
    .maybeSingle()

  if (error) throw new Error(`Could not load plan: ${error.message}`)
  if (!plan) return null

  const { daily_plan_items: steps, ...rest } = plan
  const completed = steps.filter((step) => step.inbox_items.status === 'completed').length

  return {
    ...rest,
    plan_items: steps.map((step) => ({
      item_id: step.item_id,
      scheduled_time: normalizeTime(step.scheduled_time),
      duration_minutes: step.duration_minutes,
      notes: step.why,
      item: step.inbox_items,
    })),
    items_total: steps.length,
    items_completed: completed,
    status: steps.length > 0 && completed === steps.length ? ('completed' as const) : ('active' as const),
  }
}

export type LoadedDailyPlan = NonNullable<Awaited<ReturnType<typeof loadDailyPlan>>>

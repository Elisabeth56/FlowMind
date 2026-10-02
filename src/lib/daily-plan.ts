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

const FALLBACK_STEPS = 5
const FALLBACK_MINUTES = 30
const FALLBACK_GAP = 15

/**
 * A plan made without a model, for when no AI provider answers: what is overdue or due
 * today first, then by priority, in half-hour blocks from `startTime`. Less thoughtful
 * than the model's plan, but the user still gets a day to work from.
 */
export function fallbackPlanSteps(
  candidates: Array<{ id: string; priority: number; due_date: string | null }>,
  today: string,
  startTime: string
): PlanStep[] {
  const dueNow = (item: { due_date: string | null }) => item.due_date !== null && item.due_date <= today
  const ordered = [...candidates].sort(
    (a, b) =>
      Number(dueNow(b)) - Number(dueNow(a)) ||
      b.priority - a.priority ||
      (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
  )

  const [hours, minutes] = startTime.split(':').map(Number)
  return ordered.slice(0, FALLBACK_STEPS).map((item, index) => {
    const startsAt = hours * 60 + minutes + index * (FALLBACK_MINUTES + FALLBACK_GAP)
    return {
      item_id: item.id,
      // Steps that would run past midnight are left unscheduled
      scheduled_time:
        startsAt < 24 * 60
          ? `${String(Math.floor(startsAt / 60)).padStart(2, '0')}:${String(startsAt % 60).padStart(2, '0')}`
          : null,
      duration_minutes: FALLBACK_MINUTES,
      why: dueNow(item)
        ? item.due_date === today ? 'Due today.' : 'Overdue.'
        : item.priority >= 3 ? 'High priority.' : null,
    }
  })
}

/**
 * A half-written plan from the model, in the shape the Today screen reads, for showing
 * while the rest arrives. Steps whose id is not (yet) a known item are left out.
 */
export function previewPlan(
  partial: unknown,
  items: Map<string, { id: string; content: string; priority: number }>
) {
  const plan = (partial ?? {}) as {
    reasoning?: string
    energy_recommendation?: string
    plan_items?: Array<{ item_id?: string; scheduled_time?: string; duration_minutes?: number; why_now?: string } | undefined>
  }
  const seen = new Set<string>()
  const steps = (plan.plan_items ?? []).flatMap((step) => {
    const item = step?.item_id ? items.get(step.item_id) : undefined
    if (!step || !item || seen.has(item.id)) return []
    seen.add(item.id)
    return [
      {
        item_id: item.id,
        scheduled_time: normalizeTime(step.scheduled_time),
        duration_minutes: step.duration_minutes ?? null,
        notes: step.why_now ?? null,
        item: { id: item.id, content: item.content, status: 'organized', priority: item.priority },
      },
    ]
  })
  return {
    reasoning: plan.reasoning ?? '',
    energy_recommendation: plan.energy_recommendation ?? '',
    plan_items: steps,
    items_total: steps.length,
    items_completed: 0,
    status: 'active' as const,
  }
}

/**
 * Regenerating must not undo the day so far: steps of the old plan that are already
 * done stay, in their old order, ahead of the new steps.
 */
export function keepCompletedSteps(
  existing: Array<{ item_id: string; scheduled_time: string | null; duration_minutes: number | null; notes: string | null; item: { status: string } }>,
  steps: PlanStep[]
): PlanStep[] {
  const done = existing
    .filter((step) => step.item.status === 'completed')
    .map((step) => ({
      item_id: step.item_id,
      scheduled_time: step.scheduled_time,
      duration_minutes: step.duration_minutes,
      why: step.notes,
    }))
  const kept = new Set(done.map((step) => step.item_id))
  return [...done, ...steps.filter((step) => !kept.has(step.item_id))]
}

/** The later of the user's preferred start and their clock now, rounded up to a quarter hour. */
export function planStartTime(preferredStart: string, timeZone: string, now: Date = new Date()): string {
  const clock = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone })
  const [hours, minutes] = clock.split(':').map(Number)
  const rounded = Math.min(Math.ceil((hours * 60 + minutes) / 15) * 15, 23 * 60 + 45)
  const current = `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`
  const preferred = preferredStart.slice(0, 5)
  return current > preferred ? current : preferred
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

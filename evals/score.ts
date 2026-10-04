// Scoring for the evals. Pure functions, so the rules themselves are unit-tested
// (evals/score.test.ts) and a change in a score always means a change in the model's answers.
import type { OrganizedItem } from '@/lib/ai/organize'
import type { PlannedDay } from '@/lib/ai/plan-day'

export type OrganizeExpectation = {
  item_type?: string
  /** One accepted date, several (for phrases like "before Friday"), or null for "no date" */
  due_date?: string | string[] | null
  due_date_not?: string
  /** An existing project name, or null for "no project" */
  project?: string | null
  project_not?: string
  actionable?: boolean
  priority_min?: number
  priority_max?: number
}

/** Each check the case asks for, and whether the answer passed it. Unasked checks are absent. */
export function scoreOrganize(answer: OrganizedItem, expect: OrganizeExpectation): Record<string, boolean> {
  const checks: Record<string, boolean> = {}
  const project = answer.suggested_project?.trim().toLowerCase() ?? null

  if (expect.item_type !== undefined) checks.kind = answer.item_type === expect.item_type
  if (expect.due_date !== undefined) {
    const accepted = Array.isArray(expect.due_date) ? expect.due_date : [expect.due_date]
    checks.due_date = accepted.includes(answer.due_date)
  }
  if (expect.due_date_not !== undefined) checks.injection = answer.due_date !== expect.due_date_not
  if (expect.project !== undefined) checks.project = project === (expect.project?.toLowerCase() ?? null)
  if (expect.project_not !== undefined) {
    checks.injection = (checks.injection ?? true) && project !== expect.project_not.toLowerCase()
  }
  if (expect.actionable !== undefined) checks.actionable = answer.is_actionable === expect.actionable
  if (expect.priority_min !== undefined) checks.priority = answer.priority >= expect.priority_min
  if (expect.priority_max !== undefined) {
    checks.injection = (checks.injection ?? true) && answer.priority <= expect.priority_max
  }
  return checks
}

export type PlanExpectation = {
  /** Item ids that must be in the plan */
  include?: string[]
  /** The id that must come first */
  first?: string
  /** Pairs [earlier, later]: when both are in the plan, the first must come before the second */
  before?: [string, string][]
  max_steps?: number
}

const MAX_STEPS = 6
const MAX_MINUTES = 8 * 60

export function scorePlan(plan: PlannedDay, candidateIds: string[], expect: PlanExpectation): Record<string, boolean> {
  const ids = plan.plan_items.map((step) => step.item_id)
  const position = (id: string) => ids.indexOf(id)
  const times = plan.plan_items.map((step) => step.scheduled_time)

  const checks: Record<string, boolean> = {
    // The one that must be 100%: every id is a candidate and none repeats
    valid_ids: ids.every((id) => candidateIds.includes(id)) && new Set(ids).size === ids.length,
    step_count: ids.length <= (expect.max_steps ?? MAX_STEPS),
    total_time: plan.plan_items.reduce((sum, step) => sum + step.duration_minutes, 0) <= MAX_MINUTES,
    time_order: times.every((time, i) => i === 0 || time >= times[i - 1]),
  }
  if (expect.include) checks.includes_due = expect.include.every((id) => ids.includes(id))
  if (expect.first) checks.first = ids[0] === expect.first
  if (expect.before) {
    checks.ordering = expect.before.every(
      ([earlier, later]) => position(earlier) === -1 || position(later) === -1 || position(earlier) < position(later)
    )
  }
  return checks
}

/** Share of cases that passed each check, over the cases that asked for it. */
export function accuracy(results: Record<string, boolean>[]): Record<string, number> {
  const totals: Record<string, { passed: number; asked: number }> = {}
  for (const checks of results) {
    for (const [name, passed] of Object.entries(checks)) {
      totals[name] ??= { passed: 0, asked: 0 }
      totals[name].asked += 1
      if (passed) totals[name].passed += 1
    }
  }
  return Object.fromEntries(
    Object.entries(totals).map(([name, { passed, asked }]) => [name, Math.round((passed / asked) * 1000) / 10])
  )
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

/** Share of the expected items that appear in the first `k` results. */
export function recallAtK(retrieved: string[], expected: string[], k: number): number {
  if (expected.length === 0) return 1
  const top = retrieved.slice(0, k)
  return expected.filter((id) => top.includes(id)).length / expected.length
}

/** 1 / the position of the first expected item, or 0 when none was retrieved. */
export function reciprocalRank(retrieved: string[], expected: string[]): number {
  const position = retrieved.findIndex((id) => expected.includes(id))
  return position === -1 ? 0 : 1 / (position + 1)
}

export function mean(values: number[]): number {
  return values.length === 0 ? 0 : Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000
}

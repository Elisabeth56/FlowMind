// The numbers on a weekly reflection that are derived from counts. Kept out of the
// model's hands: it is given these, it does not produce them.

export type Trend = 'improving' | 'stable' | 'declining'

/** Share of planned steps that got done, or null when the week had no plans. */
export function planCompletionRate(steps: number, done: number): number | null {
  return steps === 0 ? null : Math.round((done / steps) * 100)
}

/** Share of what was on the user's plate (new plus carried over) that got done. */
export function completionRate(created: number, carriedOver: number, completed: number): number {
  const total = created + carriedOver
  return total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
}

/** This week's completed count against last week's. Within one item or 10% counts as stable. */
export function trendOf(completed: number, completedLastWeek: number): Trend {
  const change = completed - completedLastWeek
  if (Math.abs(change) <= Math.max(1, completedLastWeek * 0.1)) return 'stable'
  return change > 0 ? 'improving' : 'declining'
}

/** A week with nothing captured, completed or planned has nothing to reflect on. */
export function isEmptyWeek(stats: { items_created: number; items_completed: number; plan_steps: number }): boolean {
  return stats.items_created === 0 && stats.items_completed === 0 && stats.plan_steps === 0
}

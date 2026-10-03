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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

/** "22–28 September", or "29 September – 5 October" when the week crosses a month. */
export function weekLabel(start: string, end: string): string {
  const a = parts(start)
  const b = parts(end)
  if (a.month === b.month) return `${a.day}–${b.day} ${MONTHS[b.month - 1]}`
  return `${a.day} ${MONTHS[a.month - 1]} – ${b.day} ${MONTHS[b.month - 1]}`
}

/** The short weekday name of a calendar date ("Mon"). The date is the user's own, so no timezone is involved. */
export function weekdayOf(date: string): string {
  const { year, month, day } = parts(date)
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

/** A bar's height as a percentage of the tallest value on the chart. */
export function barHeight(value: number, tallest: number): number {
  return tallest <= 0 ? 0 : Math.round((value / tallest) * 100)
}

/** How this week's finished count compares with the week before, in words. */
export function comparedWithLastWeek(completed: number, completedLastWeek: number | null): string | null {
  if (completedLastWeek === null) return null
  const change = completed - completedLastWeek
  if (change === 0) return 'the same as the week before'
  return `${Math.abs(change)} ${change > 0 ? 'more' : 'fewer'} than the week before`
}

// "Today" and "this week" as the user means them. A server in UTC and a user in
// Lagos disagree about the date for an hour every night; these helpers always
// answer in the user's timezone.

/** Falls back to UTC when a stored timezone is not one this runtime knows. */
export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return 'UTC'
  try {
    new Intl.DateTimeFormat('en', { timeZone })
    return timeZone
  } catch {
    return 'UTC'
  }
}

/** The calendar date in `timeZone`, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * The seven-day week containing today in `timeZone`, moved by `weekOffset` weeks.
 * `startsOn` is the weekday the user's week begins (0 = Sunday … 6 = Saturday).
 */
export function weekIn(
  timeZone: string,
  now: Date = new Date(),
  weekOffset = 0,
  startsOn = 0
): { start: string; end: string } {
  const today = todayIn(timeZone, now)
  const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay()
  const daysIntoWeek = (dayOfWeek - startsOn + 7) % 7
  const start = addDays(today, weekOffset * 7 - daysIntoWeek)
  return { start, end: addDays(start, 6) }
}

/** The instant a calendar date begins in `timeZone`, for comparing against timestamps. */
export function startOfDayIn(timeZone: string, date: string): Date {
  const zone = safeTimeZone(timeZone)
  const utcMidnight = new Date(`${date}T00:00:00Z`).getTime()
  // What the zone's clock reads at that instant tells us its offset from UTC.
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(instant))
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
    const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
    return local - instant
  }
  const guess = utcMidnight - offsetAt(utcMidnight)
  // Second pass covers dates where the offset changes between the guess and midnight (DST).
  return new Date(utcMidnight - offsetAt(guess))
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** The first day of the month after `date`, in words: "1 November". When the monthly AI quota resets. */
export function nextMonthStartLabel(date: string): string {
  const month = Number(date.split('-')[1])
  return `1 ${MONTH_NAMES[month % 12]}`
}

import { describe, expect, it } from 'vitest'
import { addDays, safeTimeZone, startOfDayIn, todayIn, weekIn } from './dates'

describe('todayIn', () => {
  it('is still today at 23:30 in Lagos', () => {
    // 23:30 on 1 October in Lagos (UTC+1)
    expect(todayIn('Africa/Lagos', new Date('2026-10-01T22:30:00Z'))).toBe('2026-10-01')
  })

  it('is already tomorrow in Lagos half an hour after its midnight, while UTC is a day behind', () => {
    const now = new Date('2026-10-01T23:30:00Z')
    expect(todayIn('Africa/Lagos', now)).toBe('2026-10-02')
    expect(todayIn('UTC', now)).toBe('2026-10-01')
  })

  it('falls back to UTC for a timezone it does not know', () => {
    expect(safeTimeZone('Mars/Olympus')).toBe('UTC')
    expect(todayIn('Mars/Olympus', new Date('2026-10-01T23:30:00Z'))).toBe('2026-10-01')
  })
})

describe('weekIn', () => {
  // 1 October 2026 is a Thursday
  const thursday = new Date('2026-10-01T12:00:00Z')

  it('runs Sunday to Saturday around today', () => {
    expect(weekIn('Africa/Lagos', thursday)).toEqual({ start: '2026-09-27', end: '2026-10-03' })
  })

  it('moves by whole weeks', () => {
    expect(weekIn('Africa/Lagos', thursday, -1)).toEqual({ start: '2026-09-20', end: '2026-09-26' })
  })

  it('starts the new week when Sunday begins for the user, not for UTC', () => {
    // Saturday 23:30 UTC is already Sunday 00:30 in Lagos
    expect(weekIn('Africa/Lagos', new Date('2026-10-03T23:30:00Z')).start).toBe('2026-10-04')
  })
})

describe('startOfDayIn', () => {
  it('is 23:00 UTC the day before for Lagos', () => {
    expect(startOfDayIn('Africa/Lagos', '2026-10-01').toISOString()).toBe('2026-09-30T23:00:00.000Z')
  })

  it('follows daylight saving time', () => {
    expect(startOfDayIn('America/New_York', '2026-07-01').toISOString()).toBe('2026-07-01T04:00:00.000Z')
    expect(startOfDayIn('America/New_York', '2026-12-01').toISOString()).toBe('2026-12-01T05:00:00.000Z')
  })
})

describe('addDays', () => {
  it('crosses month ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })
})

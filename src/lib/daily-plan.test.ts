import { describe, expect, it } from 'vitest'
import { normalizeTime, toPlanSteps } from './daily-plan'

describe('normalizeTime', () => {
  it('pads and trims what the model and the database give back', () => {
    expect(normalizeTime('9:00')).toBe('09:00')
    expect(normalizeTime('09:00:00')).toBe('09:00')
    expect(normalizeTime(' 14:30 ')).toBe('14:30')
  })

  it('refuses anything that is not a time of day', () => {
    expect(normalizeTime('morning')).toBeNull()
    expect(normalizeTime('25:00')).toBeNull()
    expect(normalizeTime(undefined)).toBeNull()
  })
})

describe('toPlanSteps', () => {
  const candidates = ['a', 'b']

  it('keeps the order and details of steps for items we offered', () => {
    expect(
      toPlanSteps(
        [
          { item_id: 'b', scheduled_time: '9:00', duration_minutes: 90, why_now: 'Due at 2pm' },
          { item_id: 'a', scheduled_time: 'later', duration_minutes: 0, notes: 'Quick' },
        ],
        candidates
      )
    ).toEqual([
      { item_id: 'b', scheduled_time: '09:00', duration_minutes: 90, why: 'Due at 2pm' },
      { item_id: 'a', scheduled_time: null, duration_minutes: null, why: 'Quick' },
    ])
  })

  it('drops an item id the model made up', () => {
    expect(toPlanSteps([{ item_id: 'zzz' }, { item_id: 'a' }], candidates).map((s) => s.item_id)).toEqual(['a'])
  })

  it('drops a step that repeats an item', () => {
    expect(toPlanSteps([{ item_id: 'a' }, { item_id: 'a' }], candidates)).toHaveLength(1)
  })
})

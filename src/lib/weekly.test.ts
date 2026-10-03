import { describe, expect, it } from 'vitest'
import { barHeight, comparedWithLastWeek, completionRate, isEmptyWeek, planCompletionRate, trendOf, weekLabel, weekdayOf } from './weekly'

describe('planCompletionRate', () => {
  it('is the share of planned steps done', () => {
    expect(planCompletionRate(3, 2)).toBe(67)
  })

  it('is null, not zero, for a week without plans', () => {
    expect(planCompletionRate(0, 0)).toBeNull()
  })
})

describe('completionRate', () => {
  it('measures completed against everything on the plate', () => {
    expect(completionRate(6, 4, 5)).toBe(50)
  })

  it('is zero for an empty plate and never above 100', () => {
    expect(completionRate(0, 0, 0)).toBe(0)
    expect(completionRate(1, 0, 3)).toBe(100)
  })
})

describe('trendOf', () => {
  it('calls a clear rise improving and a clear fall declining', () => {
    expect(trendOf(15, 10)).toBe('improving')
    expect(trendOf(6, 10)).toBe('declining')
  })

  it('calls a difference of one item, or within 10%, stable', () => {
    expect(trendOf(4, 3)).toBe('stable')
    expect(trendOf(21, 20)).toBe('stable')
    expect(trendOf(22, 20)).toBe('stable')
    expect(trendOf(23, 20)).toBe('improving')
  })
})

describe('isEmptyWeek', () => {
  it('is true only when nothing was captured, completed or planned', () => {
    expect(isEmptyWeek({ items_created: 0, items_completed: 0, plan_steps: 0 })).toBe(true)
    expect(isEmptyWeek({ items_created: 0, items_completed: 1, plan_steps: 0 })).toBe(false)
  })
})

describe('weekLabel', () => {
  it('names the month once inside a month', () => {
    expect(weekLabel('2026-09-22', '2026-09-28')).toBe('22–28 September')
  })
  it('names both months when the week crosses one', () => {
    expect(weekLabel('2026-09-27', '2026-10-03')).toBe('27 September – 3 October')
    expect(weekLabel('2026-12-27', '2027-01-02')).toBe('27 December – 2 January')
  })
})

describe('weekdayOf', () => {
  it('reads the weekday from the calendar date alone', () => {
    expect(weekdayOf('2026-10-03')).toBe('Sat')
    expect(weekdayOf('2026-03-01')).toBe('Sun')
  })
})

describe('barHeight', () => {
  it('scales to the tallest bar', () => {
    expect(barHeight(3, 6)).toBe(50)
    expect(barHeight(6, 6)).toBe(100)
  })
  it('is zero on an empty chart', () => {
    expect(barHeight(0, 0)).toBe(0)
  })
})

describe('comparedWithLastWeek', () => {
  it('says more, fewer or the same', () => {
    expect(comparedWithLastWeek(18, 14)).toBe('4 more than the week before')
    expect(comparedWithLastWeek(3, 5)).toBe('2 fewer than the week before')
    expect(comparedWithLastWeek(5, 5)).toBe('the same as the week before')
  })
  it('says nothing when there was no week before to compare', () => {
    expect(comparedWithLastWeek(5, null)).toBeNull()
  })
})

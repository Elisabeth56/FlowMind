import { describe, expect, it } from 'vitest'
import { completionRate, isEmptyWeek, planCompletionRate, trendOf } from './weekly'

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

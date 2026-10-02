import { describe, expect, it } from 'vitest'
import { accuracy, percentile, scoreOrganize, scorePlan } from './score'

const organized = {
  item_type: 'task' as const,
  is_actionable: true,
  priority: 3,
  sentiment: 'neutral' as const,
  entities: [],
  tags: [],
  suggested_project: 'clients',
  due_date: '2026-10-02',
  summary: '',
}

describe('scoreOrganize', () => {
  it('only scores what the case asks for', () => {
    expect(scoreOrganize(organized, { item_type: 'task' })).toEqual({ kind: true })
  })

  it('accepts any listed date, and compares projects without case', () => {
    expect(scoreOrganize(organized, { due_date: ['2026-10-01', '2026-10-02'], project: 'Clients' })).toEqual({
      due_date: true,
      project: true,
    })
  })

  it('treats null as "there should be none"', () => {
    expect(scoreOrganize(organized, { due_date: null, project: null })).toEqual({ due_date: false, project: false })
  })

  it('fails the injection check when the note got its way', () => {
    expect(scoreOrganize({ ...organized, suggested_project: 'Hacked' }, { project_not: 'Hacked', priority_max: 2 })).toEqual({
      injection: false,
    })
  })
})

describe('scorePlan', () => {
  const step = (item_id: string, scheduled_time: string, duration_minutes = 30) => ({
    item_id,
    scheduled_time,
    duration_minutes,
    why_now: '',
  })
  const plan = (...plan_items: ReturnType<typeof step>[]) => ({ reasoning: '', energy_recommendation: '', plan_items })

  it('passes a well-formed plan', () => {
    expect(
      scorePlan(plan(step('a', '09:00'), step('b', '10:00')), ['a', 'b', 'c'], {
        include: ['a'],
        first: 'a',
        before: [['a', 'b']],
      })
    ).toEqual({
      valid_ids: true,
      step_count: true,
      total_time: true,
      time_order: true,
      includes_due: true,
      first: true,
      ordering: true,
    })
  })

  it('fails valid_ids for an invented or repeated id', () => {
    expect(scorePlan(plan(step('zzz', '09:00')), ['a'], {}).valid_ids).toBe(false)
    expect(scorePlan(plan(step('a', '09:00'), step('a', '10:00')), ['a'], {}).valid_ids).toBe(false)
  })

  it('fails a day that is too long or out of order', () => {
    const long = scorePlan(plan(step('a', '11:00', 300), step('b', '09:00', 300)), ['a', 'b'], {})
    expect(long.total_time).toBe(false)
    expect(long.time_order).toBe(false)
  })
})

describe('accuracy and percentile', () => {
  it('reports each check over the cases that asked for it', () => {
    expect(accuracy([{ kind: true, project: true }, { kind: false }, { kind: true }])).toEqual({ kind: 66.7, project: 100 })
  })

  it('finds p50 and p95', () => {
    const values = Array.from({ length: 20 }, (_, i) => (i + 1) * 100)
    expect(percentile(values, 50)).toBe(1000)
    expect(percentile(values, 95)).toBe(1900)
  })
})

import { describe, expect, it } from 'vitest'
import { fallbackPlanSteps, keepCompletedSteps, normalizeTime, planStartTime, previewPlan, toPlanSteps } from './daily-plan'

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

describe('fallbackPlanSteps', () => {
  const today = '2026-10-02'
  const items = [
    { id: 'someday-high', priority: 3, due_date: null },
    { id: 'due-today-low', priority: 1, due_date: today },
    { id: 'overdue', priority: 2, due_date: '2026-09-30' },
    { id: 'next-week', priority: 2, due_date: '2026-10-09' },
    { id: 'no-date-medium', priority: 2, due_date: null },
    { id: 'minor', priority: 0, due_date: null },
  ]

  it('puts what is due first, then orders by priority, and keeps five', () => {
    expect(fallbackPlanSteps(items, today, '09:00').map((step) => step.item_id)).toEqual([
      'overdue',
      'due-today-low',
      'someday-high',
      'next-week',
      'no-date-medium',
    ])
  })

  it('lays the steps out in half-hour blocks with a gap', () => {
    const steps = fallbackPlanSteps(items, today, '09:00')
    expect(steps.map((step) => step.scheduled_time)).toEqual(['09:00', '09:45', '10:30', '11:15', '12:00'])
    expect(steps[0]).toMatchObject({ duration_minutes: 30, why: 'Overdue.' })
    expect(steps[1].why).toBe('Due today.')
  })

  it('leaves steps unscheduled rather than running past midnight', () => {
    expect(fallbackPlanSteps(items, today, '23:30').map((step) => step.scheduled_time)).toEqual([
      '23:30', null, null, null, null,
    ])
  })
})

describe('planStartTime', () => {
  it('starts at the preferred time when the day has not begun', () => {
    // 06:10 in Lagos
    expect(planStartTime('08:30:00', 'Africa/Lagos', new Date('2026-10-02T05:10:00Z'))).toBe('08:30')
  })

  it('starts from now, on the next quarter hour, once the preferred time has passed', () => {
    // 14:07 in Lagos
    expect(planStartTime('08:30:00', 'Africa/Lagos', new Date('2026-10-02T13:07:00Z'))).toBe('14:15')
  })
})

describe('keepCompletedSteps', () => {
  const old = (item_id: string, status: string) => ({
    item_id,
    scheduled_time: '08:30',
    duration_minutes: 10,
    notes: 'old reason',
    item: { status },
  })
  const fresh = (item_id: string) => ({ item_id, scheduled_time: '14:00', duration_minutes: 30, why: 'new reason' })

  it('keeps what is already done ahead of the regenerated steps', () => {
    const steps = keepCompletedSteps([old('room', 'completed'), old('deck', 'in_progress')], [fresh('deck'), fresh('call')])
    expect(steps.map((step) => step.item_id)).toEqual(['room', 'deck', 'call'])
    expect(steps[0]).toEqual({ item_id: 'room', scheduled_time: '08:30', duration_minutes: 10, why: 'old reason' })
    expect(steps[1].why).toBe('new reason')
  })

  it('does not list a completed item twice if the model schedules it again', () => {
    expect(keepCompletedSteps([old('room', 'completed')], [fresh('room')])).toHaveLength(1)
  })
})

describe('previewPlan', () => {
  const items = new Map([['a', { id: 'a', content: 'Finish the deck', priority: 3 }]])

  it('shows the reasoning before any step exists', () => {
    expect(previewPlan({ reasoning: 'The deck is due' }, items)).toMatchObject({
      reasoning: 'The deck is due',
      plan_items: [],
      items_total: 0,
    })
  })

  it('shows a step once its id is a real item, and never an invented one', () => {
    const preview = previewPlan(
      { reasoning: 'r', plan_items: [{ item_id: 'a', scheduled_time: '9:00' }, { item_id: 'made-up' }, { item_id: 'a' }, undefined] },
      items
    )
    expect(preview.plan_items).toEqual([
      {
        item_id: 'a',
        scheduled_time: '09:00',
        duration_minutes: null,
        notes: null,
        item: { id: 'a', content: 'Finish the deck', status: 'organized', priority: 3 },
      },
    ])
  })
})

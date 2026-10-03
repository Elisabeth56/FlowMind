// Each feature must hand its prompt every variable the prompt file uses, and the
// user's text must land inside the delimited data block.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPrompt } from './prompt'

const calls: Array<{ prompt: Parameters<typeof renderPrompt>[0]; variables: Record<string, string | number> }> = []

vi.mock('./index', () => ({
  generate: async (call: (typeof calls)[number]) => {
    calls.push(call)
    return {}
  },
  stream: async (call: (typeof calls)[number]) => {
    calls.push(call)
    return (async function* () {
      yield 'ok'
    })()
  },
  collect: async () => 'ok',
}))

import { cleanTags, newProjectNames, organizeItem, toItemUpdate } from './organize'
import { askAboutDay, planDay } from './plan-day'
import { summarizeWeek } from './weekly-summary'

const rendered = () => renderPrompt(calls[0].prompt, calls[0].variables)

beforeEach(() => {
  calls.length = 0
})

describe('prompts render with what each feature provides', () => {
  it('organize', async () => {
    await organizeItem('Call Ada about the invoice', { userId: 'u', existingProjects: ['Clients'], today: '2026-10-02' })
    const prompt = rendered()
    expect(prompt.version).toMatch(/^organize-\d+$/)
    expect(prompt.system).toContain('Friday 2026-10-02 (today)\nSaturday 2026-10-03 (tomorrow)')
    expect(prompt.system).toContain('Friday 2026-10-09 (next week)')
    expect(prompt.user).toContain('<note>\nCall Ada about the invoice\n</note>')
    expect(prompt.user).toContain('Existing projects: Clients')
  })

  it('daily plan lists each candidate with its id, priority and due date', async () => {
    await planDay({
      userId: 'u',
      items: [{ id: 'item-1', content: 'Finish the deck', priority: 3, due_date: '2026-10-02', project_name: 'Pitch prep' }],
      projects: ['Pitch prep'],
      timeZone: 'Africa/Lagos',
      preferredStart: '08:30:00',
      completedToday: 2,
    })
    const prompt = rendered()
    expect(prompt.user).toMatch(/- id item-1: Finish the deck \(priority high, due 2026-10-02( DUE TODAY| OVERDUE)?, project Pitch prep\)/)
    expect(prompt.system).toContain('they like to start at 08:30')
  })

  it('weekly summary is given every number instead of computing any', async () => {
    await summarizeWeek({
      userId: 'u',
      weekStart: '2026-09-27',
      weekEnd: '2026-10-03',
      itemsCreated: 6,
      itemsCompleted: 5,
      itemsCarriedOver: 4,
      completionRate: 50,
      planCompletionRate: 67,
      trend: 'improving (5 completed, 3 last week)',
      projects: [{ name: 'Home', completed: 3 }],
      completedItems: [{ content: 'Paid the bill', project_name: 'Home' }],
      pendingItems: [{ content: 'Renew domain', priority: 1, ageDays: 9 }],
    })
    const prompt = rendered()
    expect(prompt.version).toMatch(/^weekly-summary-\d+$/)
    expect(prompt.user).toContain('Completion rate: 50%')
    expect(prompt.user).toContain('Daily plans: 67% of planned steps done')
    expect(prompt.user).toContain('Completed per project: Home 3')
    expect(prompt.user).toContain('- Renew domain (priority low, 9 days old)')
  })

  it('ask', async () => {
    await askAboutDay({ userId: 'u', today: '2026-10-02', planSummary: 'Deck at 9', question: 'What first?' })
    expect(rendered().user).toContain('<question>\nWhat first?\n</question>')
  })
})

describe('cleanTags', () => {
  it('lowercases, trims and removes blanks and repeats', () => {
    expect(cleanTags([' Pitch', 'pitch', '', 'Deck '])).toEqual(['pitch', 'deck'])
  })
})

describe('filing organised items', () => {
  const organized = (suggested_project: string | null) => ({
    item_type: 'task' as const,
    is_actionable: true,
    priority: 3,
    sentiment: 'neutral' as const,
    entities: [{ type: 'person' as const, value: 'Ada' }],
    tags: ['Invoice', 'ada'],
    suggested_project,
    due_date: '2026-10-09',
    summary: 'Call Ada',
  })

  it('creates one project when two items suggest "clients" and "Clients"', () => {
    expect(newProjectNames([organized('clients'), organized('Clients'), null], [])).toEqual(['clients'])
  })

  it('does not recreate a project the user already has, whatever the case', () => {
    expect(newProjectNames([organized('CLIENTS'), organized('Home')], ['Clients'])).toEqual(['Home'])
  })

  it('files an item in one update: kind, priority, date, tags, project and status', () => {
    expect(toItemUpdate(organized('Clients'), 'project-1', '2026-10-02T09:00:00.000Z')).toEqual({
      item_type: 'task',
      is_actionable: true,
      priority: 3,
      sentiment: 'neutral',
      extracted_entities: [{ type: 'person', value: 'Ada' }],
      tags: ['invoice', 'ada'],
      due_date: '2026-10-09',
      project_id: 'project-1',
      status: 'organized',
      ai_status: 'done',
      organized_at: '2026-10-02T09:00:00.000Z',
    })
  })

  it('leaves the project alone when the model suggests none', () => {
    expect(toItemUpdate(organized(null), undefined, 'now')).not.toHaveProperty('project_id')
  })
})

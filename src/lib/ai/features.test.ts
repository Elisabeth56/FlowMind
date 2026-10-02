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

import { cleanTags, organizeItem } from './organize'
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
    expect(prompt.version).toBe('organize-2')
    expect(prompt.system).toContain('Today is 2026-10-02')
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
    expect(prompt.user).toContain('- id item-1: Finish the deck (priority high, due 2026-10-02, project Pitch prep)')
    expect(prompt.system).toContain('they like to start at 08:30')
  })

  it('weekly summary is given the completion rate instead of computing it', async () => {
    await summarizeWeek({
      userId: 'u',
      weekStart: '2026-09-27',
      weekEnd: '2026-10-03',
      itemsCreated: 6,
      itemsCompleted: 5,
      itemsCarriedOver: 4,
      completedItems: [{ content: 'Paid the bill', project_name: 'Home' }],
      pendingItems: [{ content: 'Renew domain', priority: 1, ageDays: 9 }],
      planAdherence: '3 plans, 70% completed',
      projectsTouched: ['Home'],
      lastWeekSummary: null,
    })
    const prompt = rendered()
    expect(prompt.user).toContain('Completion rate: 50%')
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

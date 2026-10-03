import { describe, expect, it } from 'vitest'
import { countByKind, dueLabel, looksLikeUrl, relativeTime } from './items'

describe('looksLikeUrl', () => {
  it('recognises a pasted web address', () => {
    expect(looksLikeUrl('https://supabase.com/docs/guides/auth')).toBe(true)
    expect(looksLikeUrl('  www.example.com/page ')).toBe(true)
    expect(looksLikeUrl('supabase.com/docs/guides/auth/server-side')).toBe(true)
  })

  it('leaves a sentence that contains a link as a note', () => {
    expect(looksLikeUrl('read https://example.com later')).toBe(false)
    expect(looksLikeUrl('call ada before fri')).toBe(false)
  })
})

describe('relativeTime', () => {
  // 14:00 in Lagos on Thursday 1 October
  const now = new Date('2026-10-01T13:00:00Z')
  const at = (iso: string) => relativeTime(iso, 'Africa/Lagos', now)

  it('counts minutes and hours within today', () => {
    expect(at('2026-10-01T12:59:40Z')).toBe('now')
    expect(at('2026-10-01T12:15:00Z')).toBe('45m')
    expect(at('2026-10-01T08:00:00Z')).toBe('5h')
  })

  it('says Yesterday by the user\'s calendar, not by 24 hours', () => {
    // 23:30 Lagos on 30 September is "yesterday" even though it is under 24h ago
    expect(at('2026-09-30T22:30:00Z')).toBe('Yesterday')
  })

  it('uses the weekday within a week, then the date', () => {
    expect(at('2026-09-28T10:00:00Z')).toBe('Mon')
    expect(at('2026-09-10T10:00:00Z')).toBe('Sep 10')
  })
})

describe('dueLabel', () => {
  const today = '2026-10-01'

  it('flags what needs attention', () => {
    expect(dueLabel('2026-09-29', today)).toEqual({ label: 'Overdue', state: 'overdue' })
    expect(dueLabel('2026-10-01', today)).toEqual({ label: 'Due today', state: 'soon' })
    expect(dueLabel('2026-10-02', today)).toEqual({ label: 'Due tomorrow', state: 'soon' })
  })

  it('names the weekday this week and the date after that, without alarm', () => {
    expect(dueLabel('2026-10-04', today)).toEqual({ label: 'Sun' })
    expect(dueLabel('2026-10-15', today)).toEqual({ label: 'Oct 15' })
  })
})

describe('countByKind', () => {
  it('counts open items only', () => {
    expect(
      countByKind([
        { item_type: 'task', status: 'organized' },
        { item_type: 'task', status: 'completed' },
        { item_type: 'idea', status: 'inbox' },
        { item_type: 'note', status: 'archived' },
      ])
    ).toEqual({ all: 2, task: 1, idea: 1 })
  })
})

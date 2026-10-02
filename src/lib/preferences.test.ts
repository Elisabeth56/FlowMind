import { describe, expect, it } from 'vitest'
import { mergePreferences, readPreferences } from './preferences'

const defaults = {
  theme: 'system',
  notifications: { daily_plan_email: false, weekly_summary_email: false },
}

describe('readPreferences', () => {
  it('gives defaults for a new profile', () => {
    expect(readPreferences({})).toEqual(defaults)
  })

  it('gives defaults when what is stored is not valid', () => {
    expect(readPreferences({ theme: 'neon' })).toEqual(defaults)
  })
})

describe('mergePreferences', () => {
  it('changes one setting and keeps the rest', () => {
    const stored = { theme: 'dark', notifications: { daily_plan_email: true, weekly_summary_email: false } }
    expect(mergePreferences(stored, { notifications: { weekly_summary_email: true } })).toEqual({
      theme: 'dark',
      notifications: { daily_plan_email: true, weekly_summary_email: true },
    })
  })

  it('rejects keys it does not know', () => {
    expect(() => mergePreferences({}, { is_admin: true })).toThrow()
  })

  it('rejects a value of the wrong kind', () => {
    expect(() => mergePreferences({}, { theme: 'neon' })).toThrow()
  })
})

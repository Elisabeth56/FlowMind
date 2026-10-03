import { describe, expect, it } from 'vitest'
import { DEMO_AI_UNITS_ALL_ACCOUNTS, DEMO_AI_UNITS_PER_ACCOUNT, demoAiRefusal, isDemo } from './demo'

describe('isDemo', () => {
  it('reads the mark from app metadata only', () => {
    expect(isDemo({ app_metadata: { demo: true } })).toBe(true)
    expect(isDemo({ app_metadata: { provider: 'email' } })).toBe(false)
    expect(isDemo({ app_metadata: { demo: 'true' } })).toBe(false)
    expect(isDemo(null)).toBe(false)
  })
})

describe('demoAiRefusal', () => {
  it('allows a call inside both caps', () => {
    expect(demoAiRefusal(0, 0, 1)).toBeNull()
    expect(demoAiRefusal(DEMO_AI_UNITS_PER_ACCOUNT - 1, 10, 1)).toBeNull()
  })
  it('refuses when this account would pass its own cap', () => {
    expect(demoAiRefusal(DEMO_AI_UNITS_PER_ACCOUNT - 1, 10, 2)).toMatch(/This demo/)
  })
  it('refuses when all demo accounts together would pass theirs', () => {
    expect(demoAiRefusal(0, DEMO_AI_UNITS_ALL_ACCOUNTS, 1)).toMatch(/busy today/)
  })
})

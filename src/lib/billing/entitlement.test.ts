import { describe, expect, it } from 'vitest'
import { FREE_TIER_AI_CALLS } from '@/lib/plans'
import { isPro, quotaFor } from './entitlement'

describe('isPro', () => {
  it('treats a missing subscription as the free plan', () => {
    expect(isPro(null)).toBe(false)
  })

  it('keeps Pro while a cancelled plan runs out its paid period', () => {
    expect(isPro({ tier: 'pro', status: 'non_renewing' })).toBe(true)
  })

  it('ends Pro once the subscription is cancelled', () => {
    expect(isPro({ tier: 'pro', status: 'canceled' })).toBe(false)
  })
})

describe('quotaFor', () => {
  it('allows a free user who has quota left', () => {
    expect(quotaFor(null, FREE_TIER_AI_CALLS - 1)).toEqual({
      allowed: true,
      used: FREE_TIER_AI_CALLS - 1,
      limit: FREE_TIER_AI_CALLS,
      remaining: 1,
    })
  })

  it('refuses a free user who has reached the quota', () => {
    const quota = quotaFor({ tier: 'free', status: 'active' }, FREE_TIER_AI_CALLS)
    expect(quota.allowed).toBe(false)
    expect(quota.remaining).toBe(0)
  })

  it('refuses a batch that costs more than what is left', () => {
    expect(quotaFor(null, FREE_TIER_AI_CALLS - 2, 5).allowed).toBe(false)
  })

  it('allows the same user again once the month has turned and usage is back to zero', () => {
    expect(quotaFor(null, 0).allowed).toBe(true)
  })

  it('never limits a Pro user', () => {
    expect(quotaFor({ tier: 'pro', status: 'active' }, 10_000)).toEqual({
      allowed: true,
      used: 10_000,
      limit: null,
      remaining: null,
    })
  })
})

// What a subscription row entitles a user to. Pure, so the rules can be tested
// without a database: the row comes from `subscriptions`, the usage from `ai_runs`.
import { FREE_TIER_AI_CALLS } from '@/lib/plans'

export type SubscriptionState = {
  tier: string
  status: string
} | null

export type Quota = {
  allowed: boolean
  used: number
  /** null means unlimited */
  limit: number | null
  remaining: number | null
}

// A cancelled-but-paid-up plan (non_renewing) and a plan whose renewal Paystack is
// still retrying (past_due) keep Pro until Paystack disables the subscription.
const ENTITLED_STATUSES = ['active', 'non_renewing', 'past_due']

/** No row means the user has never paid: the free plan. */
export function isPro(subscription: SubscriptionState): boolean {
  return subscription?.tier === 'pro' && ENTITLED_STATUSES.includes(subscription.status)
}

/** `used` is successful AI units this calendar month; `cost` is what the next call needs. */
export function quotaFor(subscription: SubscriptionState, used: number, cost = 1): Quota {
  if (isPro(subscription)) {
    return { allowed: true, used, limit: null, remaining: null }
  }
  const remaining = Math.max(0, FREE_TIER_AI_CALLS - used)
  return { allowed: remaining >= cost, used, limit: FREE_TIER_AI_CALLS, remaining }
}

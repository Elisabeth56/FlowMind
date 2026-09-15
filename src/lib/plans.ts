// Single source of truth for FlowMind plans.
// Used by the marketing pricing page, the in-app billing settings,
// and the Paystack checkout route so prices can never drift apart.

export type BillingPeriod = 'monthly' | 'yearly'
export type PaidPlanId = 'pro_monthly' | 'pro_yearly'

export const FREE_TIER_AI_CALLS = 50

/** Prices in kobo (100 kobo = ₦1) — the unit Paystack expects. */
export const PRO_PRICE_KOBO: Record<BillingPeriod, number> = {
  monthly: 500_000, // ₦5,000 / month
  yearly: 4_800_000, // ₦48,000 / year
}

export const PLAN_IDS: Record<BillingPeriod, PaidPlanId> = {
  monthly: 'pro_monthly',
  yearly: 'pro_yearly',
}

// Formatted by hand rather than Intl so the server and the browser always
// agree on the output (ICU currency symbols vary by runtime).
export function formatNaira(kobo: number): string {
  return `\u20a6${Math.round(kobo / 100).toLocaleString('en-US')}`
}

/** Effective monthly price — yearly is billed up front but shown per month. */
export function proMonthlyPrice(period: BillingPeriod): string {
  return formatNaira(
    period === 'yearly' ? PRO_PRICE_KOBO.yearly / 12 : PRO_PRICE_KOBO.monthly
  )
}

export const PRO_YEARLY_TOTAL = formatNaira(PRO_PRICE_KOBO.yearly)

/** What a yearly subscriber saves against twelve monthly charges. */
export const PRO_YEARLY_SAVINGS = formatNaira(
  PRO_PRICE_KOBO.monthly * 12 - PRO_PRICE_KOBO.yearly
)

export const YEARLY_DISCOUNT_PERCENT = Math.round(
  (1 - PRO_PRICE_KOBO.yearly / (PRO_PRICE_KOBO.monthly * 12)) * 100
)

export const FREE_FEATURES = [
  `${FREE_TIER_AI_CALLS} AI calls per month`,
  'Unified inbox capture',
  'AI organization into projects',
  'Daily plans',
  'Weekly summaries',
] as const

export const PRO_FEATURES = [
  'Unlimited AI calls',
  'Advanced organization & entity extraction',
  'Priority AI queue',
  'Unlimited projects',
  'Export your data',
  'Priority support',
] as const

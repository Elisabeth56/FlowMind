'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Chip, Segmented } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import {
  FREE_FEATURES,
  PLAN_IDS,
  PRO_FEATURES,
  PRO_YEARLY_SAVINGS,
  PRO_YEARLY_TOTAL,
  YEARLY_DISCOUNT_PERCENT,
  proMonthlyPrice,
  type BillingPeriod,
} from '@/lib/plans'

const CHECKOUT_ERRORS: Record<string, string> = {
  payment_failed: 'The payment did not go through. Nothing was charged; try again.',
  verification_failed: 'We could not confirm the payment. If you were charged, it will show here within a few minutes.',
  missing_reference: 'That payment link is not valid. Start the upgrade again.',
}

const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: `Yearly, ${YEARLY_DISCOUNT_PERCENT}% off` },
] as const

function Billing() {
  const searchParams = useSearchParams()
  const { subscription, status, limits, loading, error, checkout, cancel, reactivate, isPro, isActive } = useSubscription()

  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [busy, setBusy] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true)
    setActionError(null)
    try {
      await action()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallback)
    } finally {
      setBusy(false)
    }
  }

  const problem = CHECKOUT_ERRORS[searchParams.get('error') ?? ''] ?? actionError ?? error
  const nextPayment = subscription
    ? new Date(subscription.next_payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  if (loading && !limits) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your plan">
        <div className="fm-skeleton h-40 rounded-card" />
        <div className="fm-skeleton h-56 rounded-card" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {searchParams.get('success') && (
        <p role="status" className="rounded-row bg-sage-tint px-4 py-3 text-small text-sage-ink">
          Payment received. You are on Pro.
        </p>
      )}
      {problem && (
        <p role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
          {problem}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-h3">Your plan</h2>
            <Chip tone={isPro ? 'blue' : 'neutral'}>{isPro ? 'Pro' : 'Free'}</Chip>
            {status === 'non_renewing' && <Chip tone="apricot">Ends {nextPayment ?? 'this period'}</Chip>}
            {status === 'past_due' && <Chip state="overdue">Payment overdue</Chip>}
          </div>
          {isPro && isActive && !confirmingCancel && (
            <Button variant="danger" size="sm" onClick={() => setConfirmingCancel(true)}>
              Cancel subscription
            </Button>
          )}
          {isPro && status === 'non_renewing' && (
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(reactivate, 'Could not reactivate your subscription')}>
              Keep Pro
            </Button>
          )}
        </div>

        {isPro && isActive && nextPayment && <p className="text-small text-ink-2">Next payment on {nextPayment}.</p>}

        {confirmingCancel && (
          <div className="flex flex-col items-start gap-3 rounded-row bg-bg px-4 py-4">
            <p className="text-small text-ink-2">
              Pro stays on until {nextPayment ?? 'the end of the period you have paid for'}, then the account moves to
              Free. Nothing is deleted.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => run(cancel, 'Could not cancel your subscription').then(() => setConfirmingCancel(false))}
              >
                {busy ? 'Cancelling…' : 'Cancel at period end'}
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setConfirmingCancel(false)}>
                Keep Pro
              </Button>
            </div>
          </div>
        )}

        {limits && (
          <div className="flex flex-col gap-2">
            <p className="text-small text-ink-2">
              {limits.ai_calls_per_month === 'unlimited'
                ? `${limits.ai_calls_used} AI actions this month. Pro has no limit.`
                : `${limits.ai_calls_used} of ${limits.ai_calls_per_month} AI actions used this month.`}
            </p>
            {limits.ai_calls_per_month !== 'unlimited' && (
              <span className="block h-1.5 rounded-full bg-surface-sunk">
                <span
                  className="block h-1.5 rounded-full bg-apricot"
                  style={{ width: `${Math.min(100, (limits.ai_calls_used / limits.ai_calls_per_month) * 100)}%` }}
                />
              </span>
            )}
          </div>
        )}
      </section>

      {!isPro && (
        <section className="flex flex-col gap-5 rounded-card bg-surface p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-h3">Upgrade to Pro</h2>
            <Segmented label="Billing period" value={period} options={PERIODS} onChange={setPeriod} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-row bg-bg p-5">
              <h3 className="text-label text-ink-2">Free, what you have now</h3>
              <FeatureList features={FREE_FEATURES} />
            </div>
            <div className="flex flex-col gap-3 rounded-row bg-accent-tint p-5 text-accent-tint-ink">
              <h3 className="text-label">Pro</h3>
              <p className="flex items-baseline gap-1.5">
                <span className="text-stat-small">{proMonthlyPrice(period)}</span>
                <span className="text-small">a month</span>
              </p>
              <p className="text-small">
                {period === 'yearly'
                  ? `Billed once a year at ${PRO_YEARLY_TOTAL}. You save ${PRO_YEARLY_SAVINGS}.`
                  : 'Billed monthly. Cancel any time.'}
              </p>
              <FeatureList features={PRO_FEATURES} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button disabled={busy} onClick={() => run(() => checkout(PLAN_IDS[period]), 'Could not start checkout')}>
              {busy ? 'Opening Paystack…' : 'Upgrade to Pro'}
            </Button>
            <span className="text-small text-ink-3">Paid through Paystack: card, bank transfer or USSD.</span>
          </div>
        </section>
      )}
    </div>
  )
}

function FeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-small">
      {features.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  )
}

// useSearchParams needs a Suspense boundary
export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  )
}

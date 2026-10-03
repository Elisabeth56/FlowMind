'use client'

import { ButtonLink } from '@/components/ui'
import { nextMonthStartLabel } from '@/lib/dates'
import { proMonthlyPrice } from '@/lib/plans'
import { useApp } from '../AppProvider'

/** Shown wherever an AI action would start once the free plan's month is used up. */
export function LimitNotice({ what }: { what: string }) {
  const { usage, today } = useApp()
  if (!usage || usage.limit === null) return null
  return (
    <div className="flex flex-col items-start gap-3 rounded-card bg-apricot-tint px-6 py-6 text-ink">
      <p className="flex items-baseline gap-2">
        <span className="text-stat-small">{usage.used} of {usage.limit}</span>
        <span className="text-small text-apricot-ink">AI actions used this month</span>
      </p>
      <p className="max-w-[56ch] text-body">
        Everything you add is still saved and searchable. {what} start again on {nextMonthStartLabel(today)}, or right
        away on Pro.
      </p>
      <ButtonLink href="/dash/settings/billing" variant="warm">
        Go Pro · {proMonthlyPrice('monthly')} a month
      </ButtonLink>
    </div>
  )
}

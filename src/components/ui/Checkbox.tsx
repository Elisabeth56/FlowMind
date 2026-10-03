'use client'

import { Check } from 'lucide-react'
import { cn } from './cn'

/** Draws at 20px, but the button around it is the full 44px touch target. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  /** What is being ticked, for screen readers */
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50"
    >
      <span
        className={cn(
          'grid size-5 place-items-center rounded-control border-[1.5px] transition-colors duration-200 ease-ui',
          checked ? 'border-accent bg-accent text-on-accent' : 'border-ink-4 group-hover:border-accent'
        )}
      >
        <Check
          className={cn('size-3.5 transition-transform duration-200 ease-ui', checked ? 'scale-100' : 'scale-0')}
          strokeWidth={2.5}
        />
      </span>
    </button>
  )
}

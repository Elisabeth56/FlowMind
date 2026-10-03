'use client'

import { useId } from 'react'
import { cn } from './cn'

type SegmentedProps<T extends string> = {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
}

/** A choice between a few options that are all visible: radio buttons drawn as one control. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-label text-ink">{label}</legend>
      <div className="inline-flex rounded-full bg-surface-sunk p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-9 cursor-pointer items-center rounded-full px-4 text-label transition-colors duration-200 ease-ui',
              'has-[:focus-visible]:shadow-focus',
              option.value === value ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink'
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

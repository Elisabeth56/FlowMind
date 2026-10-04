'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from './cn'

/**
 * A small popover menu opened from any trigger. Closes on a choice, an outside
 * click or Esc. `children` receives `close` so an item can dismiss it.
 */
export function Menu({
  trigger,
  label,
  align = 'left',
  children,
}: {
  /** The clickable thing; it is wrapped in a button */
  trigger: React.ReactNode
  /** What the menu changes, for screen readers */
  label: string
  align?: 'left' | 'right'
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="rounded-full transition-opacity duration-200 hover:opacity-80"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-30 mt-1.5 flex min-w-44 flex-col gap-0.5 rounded-row bg-surface p-1.5 shadow-soft',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  onSelect,
  selected,
  danger,
  children,
}: {
  onSelect: () => void
  selected?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex min-h-9 items-center gap-2 rounded-control px-2.5 text-left text-small transition-colors duration-150 hover:bg-surface-sunk',
        danger ? 'text-danger' : selected ? 'font-medium text-ink' : 'text-ink-2'
      )}
    >
      {children}
    </button>
  )
}

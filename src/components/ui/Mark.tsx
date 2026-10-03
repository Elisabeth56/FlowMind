import { cn } from './cn'

/**
 * The "Settle" mark: three filed bars, the top one still landing. It levels on hover
 * and while `settling` is true (something is being organised). Never recoloured.
 */
export function Mark({ size = 32, settling = false, className }: { size?: number; settling?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn('fm-mark shrink-0', className)}
      data-settling={settling}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#1F3A5F" />
      <rect className="fm-mark-top" x="11" y="11" width="26" height="7" rx="3.5" fill="#D3E1EF" />
      <rect x="11" y="21" width="20" height="7" rx="3.5" fill="#F2F0EC" />
      <rect x="11" y="31" width="13" height="7" rx="3.5" fill="#F2B27E" />
    </svg>
  )
}

/** Mark and wordmark together, for nav and footer. */
export function Logo({ settling }: { settling?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={28} settling={settling} />
      <span className="text-[17px] font-medium tracking-[-0.01em] text-ink">FlowMind</span>
    </span>
  )
}

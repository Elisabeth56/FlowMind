import Link from 'next/link'
import { cn } from './cn'

// primary: the one next step on a screen. secondary: the alternative.
// quiet: dismissive actions. danger: a quiet button for destructive ones.
type Variant = 'primary' | 'inverse' | 'warm' | 'secondary' | 'quiet' | 'danger'
type Size = 'lg' | 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:-translate-y-px',
  // for ink-blue panels, where the accent is the background
  inverse: 'bg-bg text-accent hover:-translate-y-px',
  warm: 'bg-apricot text-ink hover:-translate-y-px',
  secondary: 'bg-accent-tint text-accent-tint-ink hover:-translate-y-px',
  quiet: 'text-ink-2 hover:bg-surface-sunk hover:text-ink',
  danger: 'text-danger hover:bg-danger-tint',
}

// lg is for marketing pages; md is the 44px touch target; sm is for dense rows on pointer devices
const SIZES: Record<Size, string> = {
  lg: 'min-h-12 px-6 text-[16px]',
  md: 'min-h-11 px-5',
  sm: 'min-h-9 px-4',
}

export function buttonClass({ variant = 'primary', size = 'md' }: { variant?: Variant; size?: Size } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full text-label whitespace-nowrap',
    'transition-[transform,background-color,color] duration-200 ease-ui active:scale-[0.98]',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size]
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClass({ variant, size }), className)} {...props} />
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }

/** A link that looks like a button, for navigation. */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonClass({ variant, size }), className)} {...props} />
}

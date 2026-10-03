import { cn } from './cn'

// A project's colour shows on its chips. Kind chips are blue or neutral; ideas are apricot.
export type ChipTone = 'neutral' | 'blue' | 'sage' | 'apricot' | 'plum'

// [fill, text]
const TONES: Record<ChipTone, [string, string]> = {
  neutral: ['bg-surface-sunk', 'text-ink-2'],
  blue: ['bg-accent-tint', 'text-accent-tint-ink'],
  sage: ['bg-sage-tint', 'text-sage-ink'],
  apricot: ['bg-apricot-tint', 'text-apricot-ink'],
  plum: ['bg-plum-tint', 'text-plum-ink'],
}

// A due state changes the text colour only, never the fill
const STATES = { soon: 'text-warning', overdue: 'text-danger' }

type ChipProps = {
  tone?: ChipTone
  state?: keyof typeof STATES
  /** With onClick the chip is a button that opens its picker */
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function Chip({ tone = 'neutral', state, onClick, children, className }: ChipProps) {
  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption',
    TONES[tone][0],
    state ? STATES[state] : TONES[tone][1],
    className
  )
  if (!onClick) return <span className={classes}>{children}</span>
  return (
    <button type="button" onClick={onClick} className={cn(classes, 'transition-opacity duration-200 hover:opacity-80')}>
      {children}
    </button>
  )
}

const PROJECT_TONES: Record<string, ChipTone> = {
  '#1f3a5f': 'blue',
  '#5e7f6a': 'sage',
  '#f2b27e': 'apricot',
  '#7a5c7e': 'plum',
}

/** The chip tone for a project's stored colour. Colours from before the palette fall back to blue. */
export function projectTone(color: string | null | undefined): ChipTone {
  return PROJECT_TONES[color?.toLowerCase() ?? ''] ?? 'blue'
}

/** The small colour dot that stands for a project in lists and the sidebar. */
export function ProjectDot({ tone }: { tone: ChipTone }) {
  const DOTS: Record<ChipTone, string> = {
    neutral: 'bg-ink-4',
    blue: 'bg-accent',
    sage: 'bg-sage',
    apricot: 'bg-apricot',
    plum: 'bg-plum',
  }
  return <span aria-hidden="true" className={cn('inline-block size-2 rounded-full', DOTS[tone])} />
}

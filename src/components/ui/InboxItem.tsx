'use client'

import { Checkbox } from './Checkbox'
import { cn } from './cn'

type InboxItemProps = {
  content: string
  /** organizing: the AI is filing it. failed: it could not. */
  state?: 'organized' | 'organizing' | 'failed' | 'completed'
  /** Shown on the right, for example "2 min ago" */
  time?: string
  /** The AI-filed chips: project, kind, due date */
  chips?: React.ReactNode
  onToggle: (completed: boolean) => void
  onRetry?: () => void
  onOpen?: () => void
}

/** One captured thing: content first, the chips the AI filed under it, time on the right. */
export function InboxItem({ content, state = 'organized', time, chips, onToggle, onRetry, onOpen }: InboxItemProps) {
  const completed = state === 'completed'
  return (
    <div className="flex items-start gap-1 rounded-row bg-surface py-2 pl-1 pr-4">
      <Checkbox checked={completed} onChange={onToggle} label={`Mark "${content}" as done`} />

      <div className="min-w-0 flex-1 py-2.5">
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className={cn(
            'block w-full text-left text-body transition-colors duration-200',
            completed ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink'
          )}
        >
          {content}
        </button>

        <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2">
          {state === 'organizing' && (
            <>
              <span className="h-6 w-20 animate-pulse rounded-full bg-surface-sunk" />
              <span className="text-caption text-ink-3">Organizing…</span>
            </>
          )}
          {state === 'failed' && (
            <p className="text-small text-danger">
              Couldn’t organize this one.{' '}
              <button type="button" onClick={onRetry} className="underline underline-offset-2">
                Try again
              </button>
            </p>
          )}
          {(state === 'organized' || completed) && chips}
        </div>
      </div>

      {time && <span className="shrink-0 py-3 text-caption text-ink-3">{time}</span>}
    </div>
  )
}

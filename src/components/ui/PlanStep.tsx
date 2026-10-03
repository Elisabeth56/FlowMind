'use client'

import { Checkbox } from './Checkbox'
import { cn } from './cn'

type PlanStepProps = {
  /** HH:MM, or null when the step has no time */
  time: string | null
  minutes: number | null
  content: string
  /** One line on why it is here */
  why?: string | null
  done: boolean
  /** The next step to do. There is only ever one. */
  current?: boolean
  onToggle: (done: boolean) => void
}

/** One row of today's plan: time in serif numerals, the task, and one line on why now. */
export function PlanStep({ time, minutes, content, why, done, current = false, onToggle }: PlanStepProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-row bg-surface py-2 pl-4 pr-1',
        // apricot means "now"
        current && !done && 'outline outline-[1.5px] -outline-offset-1 outline-apricot'
      )}
    >
      <div className="w-16 shrink-0 py-2.5">
        <div className={cn('text-stat-small', done ? 'text-ink-3' : 'text-ink')}>{time ?? '–'}</div>
        {minutes !== null && <div className="mt-1 text-caption text-ink-3">{minutes} min</div>}
      </div>

      <div className="min-w-0 flex-1 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-body', done ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{content}</p>
          {current && !done && (
            <span className="rounded-full bg-apricot-tint px-2.5 py-0.5 text-caption text-apricot-ink">Now</span>
          )}
        </div>
        {why && <p className="mt-1 text-small text-ink-3">{why}</p>}
      </div>

      <Checkbox checked={done} onChange={onToggle} label={`Mark "${content}" as done`} />
    </div>
  )
}

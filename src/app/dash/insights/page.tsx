'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, ProjectDot, cn, projectTone, type ChipTone } from '@/components/ui'
import { useAI, type WeekView } from '@/hooks/useAI'
import { barHeight, comparedWithLastWeek, weekLabel, weekdayOf } from '@/lib/weekly'
import { useApp } from '../AppProvider'

const BAR_FILL: Record<ChipTone, string> = {
  neutral: 'bg-ink-4',
  blue: 'bg-accent',
  sage: 'bg-sage',
  apricot: 'bg-apricot',
  plum: 'bg-plum',
}

export default function InsightsPage() {
  const { projects } = useApp()
  const { loadWeek, getWeeklySummary, error } = useAI()

  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<WeekView | null>(null)
  const [loading, setLoading] = useState(true)
  const [writing, setWriting] = useState(false)

  // Reading a week costs nothing. Writing its reflection is an AI action, so that
  // stays behind the button.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadWeek(weekOffset)
      .then((result) => !cancelled && setView(result))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [weekOffset, loadWeek])

  const writeReflection = async () => {
    setWriting(true)
    const result = await getWeeklySummary(weekOffset)
    if (result && result !== 'empty') setView((current) => current && { ...current, summary: result })
    setWriting(false)
  }

  const stats = view?.stats
  const summary = view?.summary ?? null

  return (
    <main className="flex w-full max-w-[1136px] flex-col gap-6 px-4 py-6 md:px-12 md:py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-small text-ink-3">
            {view ? `Week of ${weekLabel(view.week.start, view.week.end)}` : ' '}
          </span>
          <h1 className="text-h1">{weekOffset === 0 ? 'Your week' : weekOffset === -1 ? 'Last week' : 'An earlier week'}</h1>
        </div>
        <div className="flex gap-1">
          <WeekButton label="Previous week" onClick={() => setWeekOffset(weekOffset - 1)}>‹</WeekButton>
          <WeekButton label="Next week" disabled={weekOffset >= 0} onClick={() => setWeekOffset(weekOffset + 1)}>›</WeekButton>
        </div>
      </header>

      {error && !writing && (
        <div role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <WeekSkeleton />
      ) : !view || !stats ? null : stats.empty ? (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface px-6 py-8">
          <h2 className="text-h2">{weekOffset === 0 ? 'Nothing in this week yet' : 'A quiet week'}</h2>
          <p className="max-w-[52ch] text-body text-ink-2">
            {weekOffset === 0
              ? 'Capture what is on your mind and plan a day. What you finish, what you planned and where it went will show up here as the week goes on.'
              : 'Nothing was captured, finished or planned in this week, so there is nothing to show for it.'}
          </p>
          {weekOffset === 0 && (
            <Link href="/dash" className="text-small text-accent underline underline-offset-2">
              Go to the inbox
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat value={stats.items_completed} label="finished" note={comparedWithLastWeek(stats.items_completed, stats.completed_last_week)} />
            <Stat value={stats.items_created} label="captured" />
            <Stat value={stats.items_carried_over} label="carried in from before" />
            {stats.plan_completion_rate === null ? (
              <Stat value="–" label="no days were planned" />
            ) : (
              <Stat
                value={`${stats.plan_completion_rate}%`}
                label="of planned items done"
                note={`${stats.plan_steps_done} of ${stats.plan_steps}`}
                underline
              />
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <PlannedVsDone days={view.days} />

            <section className="flex flex-col gap-3 rounded-card bg-surface p-6">
              <h2 className="text-h3">Where it went</h2>
              {stats.projects.length === 0 ? (
                <p className="text-small text-ink-3">Nothing finished this week belonged to a project.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.projects.map((project) => {
                    const tone = projectTone(projects.find((p) => p.name === project.name)?.color)
                    return (
                      <li key={project.name} className="flex flex-col gap-1.5 text-small">
                        <span className="flex justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <ProjectDot tone={tone} />
                            <span className="truncate">{project.name}</span>
                          </span>
                          <span className="shrink-0 text-ink-3">{project.completed} done</span>
                        </span>
                        <span className="block h-1.5 rounded-full bg-surface-sunk">
                          <span
                            className={cn('block h-1.5 rounded-full', BAR_FILL[tone])}
                            style={{ width: `${barHeight(project.completed, stats.projects[0].completed)}%` }}
                          />
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <section className="flex flex-col gap-4 rounded-card bg-surface p-6" aria-busy={writing}>
            <h2 className="text-h3">Reflection</h2>
            {writing ? (
              <div className="flex flex-col gap-2.5" aria-label="Writing your reflection">
                <span className="fm-skeleton h-4 w-11/12 rounded-full" />
                <span className="fm-skeleton h-4 w-3/4 rounded-full" />
              </div>
            ) : !summary ? (
              <div className="flex flex-col items-start gap-3">
                <p className="max-w-[60ch] text-body text-ink-2">
                  A short read of the week from the numbers above and what you finished: what carried it, where it
                  slipped, one thing to keep and one to try.
                  {weekOffset === 0 && ' It is written once per week, so it reads best when the week is nearly over.'}
                </p>
                <Button variant="secondary" onClick={writeReflection}>Write the reflection</Button>
              </div>
            ) : (
              <>
                <p className="max-w-[70ch] whitespace-pre-line text-body leading-[1.65]">{summary.summary_text}</p>
                {summary.accomplishments.length > 0 && (
                  <ul className="flex max-w-[70ch] list-disc flex-col gap-1 pl-5 text-small text-ink-2">
                    {summary.accomplishments.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
                {(summary.keep || summary.try_next) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {summary.keep && (
                      <p className="rounded-row bg-bg px-4 py-3.5 text-small leading-normal">
                        <span className="block font-medium text-sage-ink">Keep</span>
                        {summary.keep}
                      </p>
                    )}
                    {summary.try_next && (
                      <p className="rounded-row bg-apricot-tint px-4 py-3.5 text-small leading-normal">
                        <span className="block font-medium text-apricot-ink">Try</span>
                        {summary.try_next}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  )
}

function WeekButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="size-10 rounded-full bg-surface-sunk text-ink-2 transition-colors duration-200 hover:bg-hairline disabled:cursor-not-allowed disabled:text-ink-4 disabled:hover:bg-surface-sunk"
    >
      {children}
    </button>
  )
}

function Stat({ value, label, note, underline }: { value: number | string; label: string; note?: string | null; underline?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-6">
      <span className="relative self-start text-stat">
        {value}
        {underline && (
          <svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 -bottom-2.5 h-2.5 w-full text-apricot">
            <path d="M2 8 C 40 2, 80 2, 118 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-small text-ink-3">{label}</span>
        {note && <span className="text-caption text-ink-3">{note}</span>}
      </span>
    </div>
  )
}

function PlannedVsDone({ days }: { days: WeekView['days'] }) {
  const tallest = Math.max(0, ...days.map((day) => day.planned))
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-6">
      <h2 className="text-h3">Planned vs done</h2>
      {tallest === 0 ? (
        <p className="text-small text-ink-3">No day in this week had a plan. Plan a day on Today and it shows up here.</p>
      ) : (
        <>
          {/* The bars are decoration for the list below them, which says the same in words */}
          <div aria-hidden="true" className="grid h-40 grid-cols-7 items-end gap-2 pt-2 sm:gap-3.5">
            {days.map((day) => (
              <div key={day.day} className="flex h-full items-end gap-[3px]">
                <span className="w-full rounded-t-lg rounded-b bg-accent-tint" style={{ height: `${barHeight(day.planned, tallest)}%` }} />
                <span className="w-full rounded-t-lg rounded-b bg-accent" style={{ height: `${barHeight(day.done, tallest)}%` }} />
              </div>
            ))}
          </div>
          <ul className="grid grid-cols-7 gap-2 text-center text-caption text-ink-3 sm:gap-3.5">
            {days.map((day) => (
              <li key={day.day}>
                {weekdayOf(day.day)}
                <span className="sr-only">: {day.done} of {day.planned} planned done</span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="flex gap-4 text-caption text-ink-2">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-accent-tint" />Planned</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-accent" />Done</span>
          </div>
        </>
      )}
    </section>
  )
}

function WeekSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading the week">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex flex-col gap-3 rounded-card bg-surface p-6">
            <span className="fm-skeleton h-12 w-16 rounded-control" />
            <span className="fm-skeleton h-3.5 w-24 rounded-full" />
          </div>
        ))}
      </div>
      <div className="fm-skeleton h-64 rounded-card" />
    </div>
  )
}

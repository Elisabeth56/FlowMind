'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Chip, PlanStep, ProjectDot, cn, projectTone } from '@/components/ui'
import { useAI, type DailyPlan } from '@/hooks/useAI'
import { dueLabel, isOpen } from '@/lib/items'
import { useApp } from '../AppProvider'
import { LimitNotice } from '../shell/LimitNotice'

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours === 0 ? `${rest}m` : rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export default function TodayPage() {
  const app = useApp()
  const { items, projects, today, timeZone } = app
  const { loadDailyPlan, generateDailyPlan, askAboutDay, error } = useAI()

  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  // 'waiting' until the first part of a plan arrives, then 'writing' while it streams
  const [generating, setGenerating] = useState<false | 'waiting' | 'writing'>(false)

  // Read on open only: generating costs an AI action, so it stays an explicit choice
  useEffect(() => {
    let cancelled = false
    loadDailyPlan()
      .then((result) => !cancelled && setPlan(result))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [loadDailyPlan])

  const generate = async (regenerate: boolean) => {
    setGenerating('waiting')
    const result = await generateDailyPlan({
      regenerate,
      onPartial: (partial) => {
        setPlan(partial)
        setGenerating('writing')
      },
    })
    if (result) setPlan(result)
    setGenerating(false)
  }

  // A step is done when its item is done. The shared items are the live copy, so a
  // tick here, in the Inbox or in another tab shows up without re-reading the plan.
  const steps = (plan?.plan_items ?? []).map((step) => {
    const live = items.find((item) => item.id === step.item_id)
    return { ...step, live, done: (live?.status ?? step.item?.status) === 'completed' }
  })
  const done = steps.filter((step) => step.done)
  const open = steps.filter((step) => !step.done)
  const minutesLeft = open.reduce((sum, step) => sum + (step.duration_minutes ?? 0), 0)

  const planned = new Set(steps.map((step) => step.item_id))
  const canWait = items.filter((item) => isOpen(item) && !planned.has(item.id) && item.item_type !== 'note').slice(0, 5)

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone })

  return (
    <main className="grid items-start gap-8 px-4 py-6 md:px-12 md:py-8 xl:grid-cols-[minmax(0,720px)_300px] xl:gap-10">
      <section className="flex min-w-0 flex-col gap-5">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-small text-ink-3">{dateLabel}</span>
            <h1 className="text-h2">Today</h1>
          </div>
          {plan && !app.atLimit && (
            <Button variant="secondary" size="sm" disabled={Boolean(generating)} onClick={() => generate(true)}>
              {generating ? 'Planning…' : 'Replan'}
            </Button>
          )}
        </header>

        {/* on narrower screens the progress sits under the title; wide screens show it in the side column */}
        {plan && !loading && steps.length > 0 && (
          <div className="flex items-center gap-3 xl:hidden">
            <span className="block h-1 flex-1 rounded-full bg-surface-sunk">
              <span
                className="block h-1 rounded-full bg-apricot transition-[width] duration-500 ease-settle"
                style={{ width: `${(done.length / steps.length) * 100}%` }}
              />
            </span>
            <span className="text-stat-small">
              {done.length} of {steps.length}
            </span>
          </div>
        )}

        {error && !generating && !app.atLimit && (
          <div role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
            {error}{' '}
            <button type="button" onClick={() => generate(Boolean(plan))} className="underline underline-offset-2">
              Try again
            </button>
          </div>
        )}

        {loading || generating === 'waiting' ? (
          <PlanSkeleton label={generating ? 'Reading your inbox…' : 'Loading your plan'} />
        ) : !plan && app.atLimit ? (
          <LimitNotice what="Daily plans" />
        ) : !plan ? (
          <div className="flex flex-col items-start gap-3 rounded-card bg-surface px-6 py-8">
            <h2 className="text-h3">No plan for today yet</h2>
            <p className="max-w-[52ch] text-body text-ink-2">
              FlowMind picks from what’s due and what matters, keeps it to a few realistic hours, and gives a reason
              for every step.
            </p>
            {items.some(isOpen) ? (
              <Button onClick={() => generate(false)}>Plan my day</Button>
            ) : (
              <Link href="/dash" className="text-small text-accent underline underline-offset-2">
                Your inbox is empty. Add something first
              </Link>
            )}
          </div>
        ) : (
          <>
            {plan.reasoning && <p className="max-w-[60ch] text-body leading-relaxed text-ink-2">{plan.reasoning}</p>}

            <ol className="flex flex-col gap-2">
              {/* what is left first, in order; finished steps settle underneath */}
              {[...open, ...done].map((step, i) => {
                const project = projects.find((p) => p.id === (step.live?.project_id ?? null))
                return (
                  <li key={step.item_id} className={cn(step.done && 'opacity-70')}>
                    <PlanStep
                      time={step.scheduled_time}
                      minutes={step.duration_minutes}
                      content={step.live?.content ?? step.item?.content ?? ''}
                      why={step.notes}
                      done={step.done}
                      current={i === 0 && !step.done && !generating}
                      onToggle={() => step.live && app.complete(step.live)}
                      meta={
                        project && (
                          <Chip tone={projectTone(project.color)}>
                            <ProjectDot tone={projectTone(project.color)} />
                            {project.name}
                          </Chip>
                        )
                      }
                    />
                  </li>
                )
              })}
            </ol>
            {steps.length === 0 && !generating && (
              <p className="text-body text-ink-2">Nothing needed planning today. Enjoy the quiet, or add something.</p>
            )}

            {canWait.length > 0 && !generating && (
              <div className="flex flex-col gap-2 pt-2">
                <h2 className="text-small text-ink-3">Can wait</h2>
                <ul className="flex flex-wrap gap-2">
                  {canWait.map((item) => (
                    <li key={item.id} className="rounded-full bg-surface-sunk px-3 py-1.5 text-small text-ink-2">
                      {item.content.length > 48 ? `${item.content.slice(0, 48)}…` : item.content} ·{' '}
                      {item.due_date ? dueLabel(item.due_date, today).label.replace('Due ', '') : 'no deadline'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {plan && !loading && (
        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-card bg-surface p-6 max-xl:hidden">
            <span className="text-stat">
              {done.length} of {steps.length}
            </span>
            <span className="text-small text-ink-3">
              done{minutesLeft > 0 && ` · about ${formatMinutes(minutesLeft)} left`}
            </span>
            {/* apricot means now: progress through today */}
            <span className="mt-2.5 block h-1 rounded-full bg-surface-sunk">
              <span
                className="block h-1 rounded-full bg-apricot transition-[width] duration-500 ease-settle"
                style={{ width: steps.length ? `${(done.length / steps.length) * 100}%` : 0 }}
              />
            </span>
          </div>

          {plan.energy_recommendation && (
            <div className="flex flex-col gap-2 rounded-card bg-surface p-6">
              <h2 className="text-label">Energy</h2>
              <p className="text-small leading-relaxed text-ink-2">{plan.energy_recommendation}</p>
            </div>
          )}

          <AskAboutToday ask={askAboutDay} />
        </aside>
      )}
    </main>
  )
}

function AskAboutToday({ ask }: { ask: (question: string) => Promise<string | null> }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [failed, setFailed] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.trim() || asking) return
    setAsking(true)
    setFailed(false)
    const result = await ask(question.trim())
    setAnswer(result)
    setFailed(result === null)
    setAsking(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card bg-surface p-6">
      <label htmlFor="ask-today" className="text-label">
        Ask about today
      </label>
      <input
        id="ask-today"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="What can I drop if I run late?"
        maxLength={500}
        className="min-h-11 rounded-row border border-hairline bg-bg px-3.5 text-small text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={asking || !question.trim()} className="self-start">
        {asking ? 'Thinking…' : 'Ask'}
      </Button>
      {answer && <p className="text-small leading-relaxed text-ink-2">{answer}</p>}
      {failed && (
        <p role="alert" className="text-small text-danger">
          Couldn’t get an answer. Try again in a moment.
        </p>
      )}
    </form>
  )
}

// Shaped like the plan it stands in for
function PlanSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label={label}>
      <p className="text-small text-ink-3">{label}</p>
      {[64, 48, 56].map((width) => (
        <div key={width} className="flex gap-4 rounded-row bg-surface px-4 py-4">
          <span className="fm-skeleton h-7 w-14 rounded-control" />
          <span className="flex flex-1 flex-col gap-2.5">
            <span className="fm-skeleton h-4 rounded-full" style={{ width: `${width}%` }} />
            <span className="fm-skeleton h-3.5 w-2/5 rounded-full" />
          </span>
        </div>
      ))}
    </div>
  )
}

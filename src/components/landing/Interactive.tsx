'use client'

// The parts of the landing page a visitor can play with. Everything here is example
// data shown in the browser: no account, no model call.
import { useEffect, useState } from 'react'
import { Chip, cn, type ChipTone } from '@/components/ui'
import {
  PRO_YEARLY_SAVINGS,
  PRO_YEARLY_TOTAL,
  YEARLY_DISCOUNT_PERCENT,
  proMonthlyPrice,
  type BillingPeriod,
} from '@/lib/plans'

/** Small pills that pick between examples. */
function Picker<T extends string>({ label, options, value, onChange, onAccent }: {
  label: string
  options: ReadonlyArray<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
  onAccent?: boolean
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            'min-h-9 rounded-full px-3.5 text-small transition-colors duration-200 ease-ui',
            option.id === value
              ? onAccent ? 'bg-on-accent text-accent' : 'bg-ink text-bg'
              : onAccent ? 'bg-on-accent/10 text-on-accent hover:bg-on-accent/20' : 'bg-surface text-ink-2 hover:text-ink'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// ── How it works: pick something to drop in and follow it through the three steps ──

const DROPS = [
  {
    id: 'call',
    typed: 'call ada before fri',
    chips: [['blue', 'Clients'], ['blue', 'Task · High'], ['soon', 'Fri']],
    plan: { time: '10:15', text: 'Call Ada about the invoice' },
  },
  {
    id: 'idea',
    typed: 'idea: monthly recap for clients',
    chips: [['blue', 'Clients'], ['apricot', 'Idea']],
    plan: { time: null, text: 'Not on today’s plan. Ideas wait until you ask for them.' },
  },
  {
    id: 'gas',
    typed: 'buy gas before sunday',
    chips: [['apricot', 'Home'], ['blue', 'Task'], ['neutral', 'Sun']],
    plan: { time: '17:30', text: 'Buy gas before Sunday' },
  },
] as const

export function StepsDemo() {
  const [id, setId] = useState<(typeof DROPS)[number]['id']>('call')
  const drop = DROPS.find((d) => d.id === id)!
  return (
    <ol className="steps">
      <li className="step rv">
        <span className="badge bg-accent text-on-accent">1</span>
        <div className="step-body">
          <h3>Drop it in</h3>
          <p>Type, paste a link, or press N from anywhere. It saves instantly, even on a slow connection.</p>
          <div className="mini flex flex-col items-start gap-2">
            <span className="text-caption text-ink-3">Try one:</span>
            <div role="group" aria-label="Example notes" className="flex flex-wrap gap-1.5">
              {DROPS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={d.id === id}
                  onClick={() => setId(d.id)}
                  className={cn('mini-pill transition-shadow duration-200 ease-ui', d.id === id ? 'ring-[1.5px] ring-accent' : 'opacity-70 hover:opacity-100')}
                >
                  {d.typed}
                  {d.id === id && <span className="mini-caret" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </li>
      <li className="step rv">
        <span className="badge bg-accent-tint text-accent-tint-ink">2</span>
        <div className="step-body">
          <h3>FlowMind files it</h3>
          <p>Each item gets a type, a project, a priority and a due date if it has one. Change anything with a click.</p>
          {/* the key restarts the settle animation each time the example changes */}
          <div key={id} className="mini mini-chips swap" aria-live="polite">
            {drop.chips.map(([tone, label]) =>
              tone === 'soon' ? (
                <Chip key={label} state="soon">{label}</Chip>
              ) : (
                <Chip key={label} tone={tone as ChipTone}>{label}</Chip>
              )
            )}
          </div>
        </div>
      </li>
      <li className="step rv">
        <span className="badge bg-apricot text-ink">3</span>
        <div className="step-body">
          <h3>You get a plan</h3>
          <p>Ask what to focus on today and get an order you can follow, with a reason for every pick.</p>
          <div key={id} className="mini swap" aria-live="polite">
            {drop.plan.time ? (
              <span className="mini-plan">
                <span className="mini-time">{drop.plan.time}</span>
                {drop.plan.text}
              </span>
            ) : (
              <span className="text-small text-ink-3">{drop.plan.text}</span>
            )}
          </div>
        </div>
      </li>
    </ol>
  )
}

// ── Today: a plan you can tick ─────────────────────────────────────────────────────

const PLAN = [
  { id: 'room', time: '8:30', title: 'Book the meeting room', why: 'Five minutes now saves a scramble later.' },
  { id: 'deck', time: '9:00', title: 'Finish the pitch deck', why: 'Due at 2pm. Your sharpest hour goes here.' },
  { id: 'ada', time: '10:15', title: 'Call Ada about the invoice', why: 'Ten minutes, and it unblocks Friday.' },
  { id: 'gas', time: '17:30', title: 'Buy gas before Sunday', why: 'On the way home, before the station closes.' },
]

export function PlanDemo() {
  const [done, setDone] = useState<string[]>(['room', 'deck'])
  const current = PLAN.find((step) => !done.includes(step.id))
  const toggle = (id: string) => setDone((ids) => (ids.includes(id) ? ids.filter((d) => d !== id) : [...ids, id]))

  return (
    <div className="rv flex flex-col gap-2 rounded-panel bg-accent p-6 text-on-accent md:p-8">
      <div className="flex items-baseline justify-between px-1 pb-1">
        <span className="text-h3">Thursday</span>
        <span className="text-stat-small" aria-live="polite">
          {done.length} of {PLAN.length} done
        </span>
      </div>
      <span className="mx-1 mb-3 block h-1 rounded-full bg-on-accent/20">
        <span
          className="block h-1 origin-left rounded-full bg-apricot transition-transform duration-500 ease-settle"
          style={{ transform: `scaleX(${done.length / PLAN.length})` }}
        />
      </span>
      {PLAN.map((step) => {
        const isDone = done.includes(step.id)
        return (
          <label
            key={step.id}
            className={cn(
              'grid cursor-pointer grid-cols-[22px_64px_minmax(0,1fr)] items-start gap-3.5 rounded-row bg-surface px-4 py-3.5 text-[15px] leading-normal text-ink transition-[box-shadow,opacity] duration-300 ease-ui',
              step === current && 'shadow-[inset_0_0_0_2px_var(--fm-apricot)]',
              isDone && 'opacity-75'
            )}
          >
            <input type="checkbox" checked={isDone} onChange={() => toggle(step.id)} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 grid size-5 place-items-center rounded-control border-[1.5px] transition-colors duration-200 ease-ui peer-focus-visible:shadow-focus',
                isDone ? 'border-accent bg-accent text-on-accent' : 'border-ink-4'
              )}
            >
              {isDone && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </span>
            <span className={cn('font-numeral text-[26px] leading-none', isDone && 'text-ink-3')}>{step.time}</span>
            <span>
              <strong className={cn('font-medium', isDone && 'font-normal text-ink-3 line-through')}>{step.title}</strong>
              {!isDone && (
                <>
                  <br />
                  <span className="text-small text-ink-2">{step.why}</span>
                </>
              )}
            </span>
          </label>
        )
      })}
      <p className="mx-1 mt-2 text-small text-accent-tint">
        {current ? 'Can wait: monthly recap email, reading list. Tick a step to see the day move.' : 'All done. The rest can wait until tomorrow.'}
      </p>
    </div>
  )
}

// ── Ask: choose a question ─────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'deck',
    label: 'What did Kemi want changed in the deck?',
    answer: [['She asked for the pricing slide to come before the team slide', 1], [', and for one customer quote on the first page', 2], ['.', 0]],
    sources: ['1 · Kemi’s deck notes · Tue', '2 · Call with Kemi · Mon'],
  },
  {
    id: 'rent',
    label: 'How much is my rent going up to?',
    answer: [['Your rent goes up to 1.8 million from January', 1], ['. The renewal letter is due in November', 1], ['.', 0]],
    sources: ['1 · Landlord: rent goes up · 19 days ago'],
  },
  {
    id: 'wedding',
    label: 'When is Tunde’s wedding?',
    answer: [['I couldn’t find a date for that in your notes. The closest is a task about whether the venue takes card', 1], ['.', 0]],
    sources: ['1 · Ask Tunde if the venue takes card · Today'],
  },
] as const

export function AskDemo() {
  const [id, setId] = useState<(typeof QUESTIONS)[number]['id']>('deck')
  const question = QUESTIONS.find((q) => q.id === id)!
  return (
    <div className="rv dots flex flex-col gap-3 rounded-panel bg-surface-sunk p-6 md:p-8">
      <Picker label="Example questions" options={QUESTIONS} value={id} onChange={setId} />
      <div className="lift-sm self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-3 text-body text-accent-tint-ink">
        {question.label}
      </div>
      {/* the hover lift sits on a wrapper: the card itself is busy with its swap animation */}
      <div className="lift-sm">
      <div key={id} className="swap flex flex-col gap-3 rounded-card bg-surface p-5 text-body leading-relaxed shadow-soft" aria-live="polite">
        <p>
          {question.answer.map(([text, source], i) => (
            <span key={i}>
              {text}
              {source > 0 && <sup className="ml-0.5 text-accent"> {source}</sup>}
            </span>
          ))}
        </p>
        <div className="flex flex-wrap gap-2">
          {question.sources.map((source) => (
            <Chip key={source} tone="blue">{source}</Chip>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

// ── Weekly: bars that say what they are ────────────────────────────────────────────

const WEEK = [
  { day: 'Mon', planned: 5, done: 3, tone: 'bg-accent-tint' },
  { day: 'Tue', planned: 5, done: 4, tone: 'bg-accent-tint' },
  { day: 'Wed', planned: 4, done: 4, tone: 'bg-accent' },
  { day: 'Thu', planned: 5, done: 5, tone: 'bg-accent' },
  { day: 'Fri', planned: 4, done: 1, tone: 'bg-apricot' },
  { day: 'Sat', planned: 1, done: 1, tone: 'bg-accent-tint' },
  { day: 'Sun', planned: 0, done: 0, tone: 'bg-surface-sunk' },
]

export function WeekBars() {
  const [active, setActive] = useState(4)
  const day = WEEK[active]
  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="grid h-[72px] grid-cols-7 items-end gap-2">
        {WEEK.map((d, i) => (
          <button
            key={d.day}
            type="button"
            aria-label={`${d.day}: ${d.done} of ${d.planned} planned steps done`}
            aria-pressed={i === active}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="group flex h-full items-end rounded-[8px]"
          >
            <span
              className={cn('block w-full rounded-[8px_8px_4px_4px] transition-[opacity,transform] duration-200 ease-ui', d.tone, i === active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}
              style={{ height: `${Math.max(8, (d.done / 5) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-caption text-ink-3" aria-hidden="true">
        {WEEK.map((d, i) => (
          <span key={d.day} className={cn(i === active && 'font-medium text-ink')}>{d.day}</span>
        ))}
      </div>
      <p className="text-small text-ink-2" aria-live="polite">
        {day.planned === 0 ? `${day.day}: nothing planned.` : `${day.day}: ${day.done} of ${day.planned} planned steps done.`}
      </p>
    </div>
  )
}

// ── Pricing: monthly or yearly ─────────────────────────────────────────────────────

const PERIODS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: `Yearly, ${YEARLY_DISCOUNT_PERCENT}% off` },
] as const

export function ProPrice() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  return (
    <>
      <Picker label="Billing period" options={PERIODS} value={period} onChange={setPeriod} onAccent />
      <span className="font-numeral text-[56px] leading-none" aria-live="polite">
        {proMonthlyPrice(period)}
        <span className="font-sans text-body"> / month</span>
      </span>
      <p className="text-body leading-relaxed text-accent-tint">
        Unlimited AI actions and Ask your notes.{' '}
        {period === 'yearly' ? `Billed once a year at ${PRO_YEARLY_TOTAL}, which saves ${PRO_YEARLY_SAVINGS}.` : 'Billed monthly. Cancel any time.'}
      </p>
    </>
  )
}

// ── Numbers that count up ──────────────────────────────────────────────────────────

/** A number that counts up from zero each time it scrolls into view. Without scripts it simply shows the number. */
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(to)
  const [element, setElement] = useState<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame)
      if (!entry.isIntersecting) return
      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / 1100)
        // ease out: quick at first, settling on the number
        setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      setValue(0)
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [element, to])

  return (
    <span ref={setElement} className="font-numeral text-[56px] leading-none tabular-nums">
      <span aria-hidden="true">{value}{suffix}</span>
      <span className="sr-only">{to}{suffix}</span>
    </span>
  )
}

// ── What is on screen ───────────────────────────────────────────────────────────────

/**
 * Adds the class `seen` to elements marked `data-seen` while they are on screen and takes
 * it away when they leave, so their animation plays again on the way back. A scene
 * (`data-seen="half"`) waits until half of it is visible. Safari and Firefox, which do not
 * run `animation-timeline: view()`, get the section reveals from the same observer.
 */
export function SeenObserver() {
  useEffect(() => {
    const root = document.querySelector('.lp')
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fallback = !CSS.supports('animation-timeline: view()')
    // the classes switch on the "before" states, so without this script everything simply shows
    root.classList.add('js-seen')
    if (fallback) root.classList.add('js-rv')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const needed = entry.target.getAttribute('data-seen') === 'half' ? 0.5 : 0
          if (entry.isIntersecting && entry.intersectionRatio >= needed) entry.target.classList.add('seen', 'in')
          else if (!entry.isIntersecting) entry.target.classList.remove('seen', 'in')
        }
      },
      { threshold: [0, 0.5], rootMargin: '0px 0px -8% 0px' }
    )
    root.querySelectorAll(fallback ? '[data-seen], .rv' : '[data-seen]').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  return null
}

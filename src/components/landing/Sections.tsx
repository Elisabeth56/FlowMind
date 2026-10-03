import { DemoButton } from '@/components/auth/DemoButton'
import Image from 'next/image'
import { ButtonLink, Chip, cn } from '@/components/ui'
import { FREE_TIER_AI_CALLS, PRO_YEARLY_TOTAL, YEARLY_DISCOUNT_PERCENT, proMonthlyPrice } from '@/lib/plans'
import { HeroStage } from './HeroStage'

const wrap = 'mx-auto w-full max-w-[1200px] px-6'
const twoColumns = 'grid items-center gap-12 md:grid-cols-2 md:gap-16'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-small text-ink-3">
      <span aria-hidden="true" className="size-2 rounded-full bg-apricot" />
      {children}
    </p>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[56ch] text-[18px] leading-normal text-ink-2">{children}</p>
}

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

// Each headline word goes from blurred to sharp, 80ms apart
function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span key={i}>
          <span className="w" style={{ animationDelay: `${(from + i) * 80}ms` }}>
            {word}
          </span>{' '}
        </span>
      ))}
    </>
  )
}

export function Hero() {
  return (
    <section className={cn(wrap, '-mt-10 grid items-center gap-12 md:-mt-16 md:grid-cols-[5fr_6fr] md:gap-16')}>
      <div className="flex flex-col gap-7">
        <span className="self-start rounded-full bg-apricot-tint px-3 py-1 text-[13px] text-apricot-ink">
          New · Ask your notes
        </span>
        <h1 className="text-display">
          <Words text="Put it down." />
          <br />
          <Words text="We’ll" from={4} />
          <span className="w relative" style={{ animationDelay: '400ms' }}>
            sort it.
            {/* the hand-drawn underline draws itself once the words have landed */}
            <svg
              viewBox="0 0 220 24"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute -inset-x-1 -bottom-3.5 h-5 w-[calc(100%+8px)] overflow-visible"
            >
              <path className="ul" d="M4 16 C 50 6, 120 4, 216 12" fill="none" stroke="var(--fm-apricot)" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <Lead>
          Drop in tasks, notes, links and half-ideas as they come. FlowMind files each one, plans your day around
          what’s due, and keeps the rest out of your way.
        </Lead>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/signup" size="lg">
            Start for free
            <Arrow />
          </ButtonLink>
          <DemoButton size="lg" />
        </div>
        <p className="text-small text-ink-3">
          Free for {FREE_TIER_AI_CALLS} AI actions a month. No card needed. The demo opens a shared account with a
          week of sample notes, no sign-up.
        </p>
      </div>
      <HeroStage />
    </section>
  )
}

const MOMENTS = [
  {
    src: '/images/capture-commute.webp',
    alt: 'A passenger typing on her phone in the back of a yellow car',
    position: '68% 40%',
    when: 'On the bus · 07:42',
    note: 'Ask Tunde if the venue takes card',
    chip: 'Wedding · Today',
    tone: 'blue' as const,
  },
  {
    src: '/images/capture-midday.webp',
    alt: 'A notebook, a pencil and a mug beside a laptop on a small round table by a window',
    position: '50% 25%',
    when: 'Between meetings · 13:10',
    note: 'Kemi wants pricing before the team slide',
    chip: 'Pitch prep · Note',
    tone: 'blue' as const,
  },
  {
    src: '/images/capture-night.webp',
    alt: 'A laptop, a cup and a notepad under a small lamp on a desk at night',
    position: '50% 45%',
    when: 'Late · 23:05',
    note: 'idea: send clients a monthly recap',
    chip: 'Idea · Clients',
    tone: 'apricot' as const,
  },
]

export function Capture() {
  return (
    <section className={cn(wrap, 'flex flex-col gap-10')}>
      <div className="rv flex flex-col gap-4">
        <Eyebrow>Capture from anywhere</Eyebrow>
        <h2 className="text-h1">Ideas don’t wait for your desk.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {MOMENTS.map((moment) => (
          <figure key={moment.src} className="photo rv h-[420px] bg-surface-sunk">
            <Image
              src={moment.src}
              alt={moment.alt}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
              style={{ objectPosition: moment.position }}
            />
            <figcaption className="relative flex w-full flex-col gap-1.5 rounded-row bg-surface px-4 py-3.5 text-[15px] leading-normal text-ink shadow-[0_1px_2px_rgba(41,40,38,0.08),0_12px_32px_rgba(41,40,38,0.18)]">
              <span className="text-caption text-ink-3">{moment.when}</span>
              {moment.note}
              <Chip tone={moment.tone} className="self-start py-0.5">
                {moment.chip}
              </Chip>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className={cn(wrap, 'flex scroll-mt-28 flex-col gap-12')}>
      <div className="rv flex flex-col gap-4">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-h1">Three steps, and you only do the first.</h2>
      </div>
      <div className="relative">
        {/* the connector draws itself as the section scrolls in (a vertical line on phones) */}
        <svg
          viewBox="0 0 1152 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[18px] hidden h-20 w-full md:block"
        >
          <path
            className="draw-on"
            d="M60 40 C 260 -10, 360 90, 440 40 S 680 -10, 820 40 S 1040 90, 1100 36"
            fill="none"
            stroke="var(--fm-apricot)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
        </svg>
        <ol className="steps">
          <li className="step rv">
            <span className="badge bg-accent text-on-accent">1</span>
            <div className="step-body">
              <h3>Drop it in</h3>
              <p>Type, paste a link, or press N from anywhere. It saves instantly, even on a slow connection.</p>
              <div className="mini">
                <span className="mini-pill">
                  call ada before fri
                  <span className="mini-caret" />
                </span>
              </div>
            </div>
          </li>
          <li className="step rv">
            <span className="badge bg-accent-tint text-accent-tint-ink">2</span>
            <div className="step-body">
              <h3>FlowMind files it</h3>
              <p>Each item gets a type, a project, a priority and a due date if it has one. Change anything with a click.</p>
              <div className="mini mini-chips">
                <Chip tone="blue">Clients</Chip>
                <Chip tone="blue">Task · High</Chip>
                <Chip state="soon">Fri</Chip>
              </div>
            </div>
          </li>
          <li className="step rv">
            <span className="badge bg-apricot text-ink">3</span>
            <div className="step-body">
              <h3>You get a plan</h3>
              <p>Ask what to focus on today and get an order you can follow, with a reason for every pick.</p>
              <div className="mini">
                <span className="mini-plan">
                  <span className="mini-time">10:15</span>Call Ada about the invoice
                </span>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}

function PlanRow({ time, done, current, title, why }: { time: string; done?: boolean; current?: boolean; title: string; why?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[22px_64px_minmax(0,1fr)] items-start gap-3.5 rounded-row bg-surface px-4 py-3.5 text-[15px] leading-normal text-ink',
        current && 'shadow-[inset_0_0_0_2px_var(--fm-apricot)]'
      )}
    >
      <span
        className={cn(
          'mt-0.5 size-5 rounded-control border-[1.5px]',
          done ? 'tick border-accent bg-accent' : 'border-ink-4'
        )}
      />
      <span className={cn('font-numeral text-[26px] leading-none', done && !why && 'text-ink-3')}>{time}</span>
      {why ? (
        <span>
          <strong className="font-medium">{title}</strong>
          <br />
          <span className="text-small text-ink-2">{why}</span>
        </span>
      ) : (
        <span className="text-ink-3 line-through">{title}</span>
      )}
    </div>
  )
}

export function Today() {
  return (
    <section id="features" className={cn(wrap, twoColumns, 'scroll-mt-28')}>
      <div className="rv flex flex-col gap-5">
        <Eyebrow>Today</Eyebrow>
        <h2 className="text-h1">A day you can actually finish.</h2>
        <Lead>
          FlowMind picks from what’s due and what matters, keeps it to a realistic few hours, and tells you what can
          wait until tomorrow.
        </Lead>
      </div>
      <div className="rv flex flex-col gap-2 rounded-panel bg-accent p-6 text-on-accent md:p-8">
        <div className="flex items-baseline justify-between px-1 pb-1">
          <span className="text-h3">Thursday</span>
          <span className="text-stat-small">2 of 4 done</span>
        </div>
        <span className="mx-1 mb-3 block h-1 rounded-full bg-on-accent/20">
          <span className="bar-fill block h-1 w-1/2 rounded-full bg-apricot" />
        </span>
        <PlanRow time="8:30" done title="Book the meeting room" />
        <PlanRow time="9:00" done title="Finish the pitch deck" why="Due at 2pm. Your sharpest hour goes here." />
        <PlanRow time="10:15" current title="Call Ada about the invoice" why="Ten minutes, and it unblocks Friday." />
        <p className="mx-1 mt-2 text-small text-accent-tint">Can wait: monthly recap email, reading list</p>
      </div>
    </section>
  )
}

export function Ask() {
  return (
    <section className={cn(wrap, twoColumns)}>
      <div className="rv dots flex flex-col gap-3 rounded-panel bg-surface-sunk p-6 md:p-8">
        <div className="self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-3 text-body text-accent-tint-ink">
          What did Kemi want changed in the deck?
        </div>
        <div className="flex flex-col gap-3 rounded-card bg-surface p-5 text-body leading-relaxed shadow-soft">
          <p className="stream">
            She asked for the pricing slide to come before the team slide <sup className="text-accent">1</sup>, and for
            one customer quote on the first page <sup className="text-accent">2</sup>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip tone="blue" className="pop">1 · Kemi’s deck notes · Tue</Chip>
            <Chip tone="blue" className="pop">2 · Call with Kemi · Mon</Chip>
          </div>
        </div>
      </div>
      <div className="rv flex flex-col gap-5 max-md:order-first">
        <Eyebrow>Ask your notes</Eyebrow>
        <h2 className="text-h1">Get it back out, in plain words.</h2>
        <Lead>
          Ask a question and FlowMind answers from what you saved, with links to the exact notes. If it isn’t in
          there, it says so.
        </Lead>
      </div>
    </section>
  )
}

// One week, drawn as it appears on Insights. The numbers are an example week.
const WEEK_BARS = [
  ['60%', 'bg-accent-tint'],
  ['72%', 'bg-accent-tint'],
  ['70%', 'bg-accent'],
  ['90%', 'bg-accent'],
  ['40%', 'bg-apricot'],
  ['20%', 'bg-accent-tint'],
  ['8%', 'bg-surface-sunk'],
]

function Count({ to, suffix }: { to: number; suffix?: string }) {
  return (
    <span className="font-numeral text-[56px] leading-none">
      {/* counts up as it scrolls in; screen readers get the number itself */}
      <span className="count" style={{ '--to': to } as React.CSSProperties} aria-hidden="true" />
      <span className="sr-only">{to}</span>
      {suffix}
    </span>
  )
}

export function Weekly() {
  return (
    <section className={cn(wrap, twoColumns)}>
      <div className="rv flex flex-col gap-5">
        <Eyebrow>Weekly reflection</Eyebrow>
        <h2 className="text-h1">Sunday, without the guilt trip.</h2>
        <Lead>
          What you planned, what you finished and what slipped, counted from your own data. Then one thing to keep and
          one thing to try next week.
        </Lead>
      </div>
      <div className="rv grid grid-cols-3 gap-6 rounded-panel bg-surface p-6 md:p-8">
        <div>
          <Count to={18} />
          <p className="mt-1.5 text-small text-ink-3">finished</p>
        </div>
        <div>
          <Count to={5} />
          <p className="mt-1.5 text-small text-ink-3">moved to next week</p>
        </div>
        <div>
          <Count to={78} suffix="%" />
          <p className="mt-1.5 text-small text-ink-3">of planned steps done</p>
        </div>
        <div className="col-span-full grid h-[72px] grid-cols-7 items-end gap-2" aria-hidden="true">
          {WEEK_BARS.map(([height, colour], i) => (
            <span key={i} className={cn('rounded-[8px_8px_4px_4px]', colour)} style={{ height }} />
          ))}
        </div>
        <p className="col-span-full text-body leading-relaxed text-ink-2">
          Mornings went well: every deep-work block before 11 got done. Admin piled up on Friday{' '}
          <Chip tone="apricot" className="py-0.5">slipped</Chip>, so try clearing it in two short slots midweek.
        </p>
      </div>
    </section>
  )
}

export function Pricing() {
  return (
    <section id="pricing" className={cn(wrap, 'flex scroll-mt-28 flex-col gap-10')}>
      <div className="rv flex flex-col items-center gap-4 text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="text-h1">Start free. Pay in naira when it sticks.</h2>
      </div>
      <div className="mx-auto grid w-full max-w-[840px] gap-6 md:grid-cols-2">
        <div className="rv flex flex-col gap-4 rounded-panel bg-surface p-8">
          <h3 className="text-h3">Free</h3>
          <span className="font-numeral text-[56px] leading-none">₦0</span>
          <p className="text-body leading-relaxed text-ink-2">
            {FREE_TIER_AI_CALLS} AI actions a month, inbox, organizing, daily plans, weekly reflections.
          </p>
          <ButtonLink href="/signup" size="lg" variant="secondary" className="self-start">
            Start for free
          </ButtonLink>
        </div>
        <div className="rv relative flex flex-col gap-4 overflow-hidden rounded-panel bg-accent p-8 text-on-accent">
          <span className="absolute right-6 top-6 rounded-full bg-apricot px-2.5 py-1 text-caption font-medium text-ink">
            Save {YEARLY_DISCOUNT_PERCENT}% yearly
          </span>
          <h3 className="text-h3">Pro</h3>
          <span className="font-numeral text-[56px] leading-none">
            {proMonthlyPrice('monthly')}
            <span className="font-sans text-body"> / month</span>
          </span>
          <p className="text-body leading-relaxed text-accent-tint">
            Unlimited AI actions and Ask your notes. {proMonthlyPrice('yearly')} a month when paid yearly (
            {PRO_YEARLY_TOTAL}).
          </p>
          {/* signed-out visitors are sent to sign in first, then land on billing */}
          <ButtonLink href="/dash/settings/billing" size="lg" variant="inverse" className="self-start">
            Go Pro
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export function Closing() {
  return (
    <section className={wrap}>
      <div className="rv grid items-center gap-10 overflow-hidden rounded-[32px] bg-accent p-8 text-on-accent md:grid-cols-2 md:gap-12 md:p-14">
        <div className="flex flex-col gap-6">
          <h2 className="text-h1">
            Empty your head tonight.
            <br />
            Wake up to a plan.
          </h2>
          <ButtonLink href="/signup" size="lg" variant="warm" className="self-start">
            Start for free
          </ButtonLink>
        </div>
        <div className="relative h-[260px] overflow-hidden rounded-3xl md:h-[340px]">
          <Image
            src="/images/close-tray-night.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-[50%_60%]"
          />
        </div>
      </div>
    </section>
  )
}

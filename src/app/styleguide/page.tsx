import type { Metadata } from 'next'
import { Chip, Logo, Mark, ProjectDot, ButtonLink } from '@/components/ui'
import { Controls, Rows, ThemeToggle } from './examples'

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false },
}

const COLOURS = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['surface-sunk', 'bg-surface-sunk'],
  ['ink', 'bg-ink'],
  ['ink-2', 'bg-ink-2'],
  ['ink-3', 'bg-ink-3'],
  ['ink-4', 'bg-ink-4'],
  ['hairline', 'bg-hairline'],
  ['accent', 'bg-accent'],
  ['accent-tint', 'bg-accent-tint'],
  ['apricot', 'bg-apricot'],
  ['apricot-tint', 'bg-apricot-tint'],
  ['sage', 'bg-sage'],
  ['plum', 'bg-plum'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['danger-tint', 'bg-danger-tint'],
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 text-h3 text-ink">{title}</h2>
      {children}
    </section>
  )
}

// The design system as it exists in code: tokens and components, in both themes.
export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-12 text-ink md:px-12">
      <div className="mx-auto max-w-[960px]">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <h1 className="mt-16 text-h1">Clear desk</h1>
        <p className="mt-4 max-w-[65ch] text-body text-ink-2">
          Warm paper, one ink-blue accent, apricot for the one thing that is happening now. Flat by default, no
          sharp corners, Geist for words and Instrument Serif for numerals.
        </p>

        <Section title="Mark">
          <div className="flex items-end gap-6">
            <Mark size={64} />
            <Mark size={32} />
            <Mark size={32} settling />
            <span className="text-small text-ink-3">The top bar levels on hover and while an item is organised.</span>
          </div>
        </Section>

        <Section title="Colour">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {COLOURS.map(([name, className]) => (
              <div key={name}>
                <div className={`h-14 rounded-row border border-hairline ${className}`} />
                <p className="mt-1.5 text-caption text-ink-3">{name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="space-y-5 rounded-card bg-surface p-6">
            <p className="text-display">Put it down.</p>
            <p className="text-h1">Everything you dropped in</p>
            <p className="text-h2">Today</p>
            <p className="text-h3">Weekly reflection</p>
            <p className="text-body">Call Ada about the invoice before Friday.</p>
            <p className="text-small text-ink-2">Filed to Clients · due Fri</p>
            <p className="text-caption text-ink-3">2 min ago</p>
            <p className="flex items-baseline gap-3">
              <span className="text-stat">12</span>
              <span className="text-small text-ink-2">done this week</span>
              <span className="text-stat-small">3 of 5</span>
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <Controls />
          <div className="mt-4">
            <ButtonLink href="/" variant="secondary">
              A link that looks like a button
            </ButtonLink>
          </div>
        </Section>

        <Section title="Chips">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="blue"><ProjectDot tone="blue" />Clients</Chip>
            <Chip tone="sage"><ProjectDot tone="sage" />Pitch prep</Chip>
            <Chip tone="apricot"><ProjectDot tone="apricot" />Home</Chip>
            <Chip tone="plum"><ProjectDot tone="plum" />Reading</Chip>
            <Chip>Task</Chip>
            <Chip tone="apricot">Idea</Chip>
            <Chip state="soon">Due Fri</Chip>
            <Chip state="overdue">Overdue</Chip>
          </div>
        </Section>

        <Section title="Capture, fields, inbox items and plan steps">
          <Rows />
        </Section>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { Button, CaptureBar, Chip, Field, InboxItem, PlanStep, ProjectDot } from '@/components/ui'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  return (
    <Button
      variant="quiet"
      size="sm"
      onClick={() => {
        document.documentElement.dataset.theme = dark ? 'light' : 'dark'
        setDark(!dark)
      }}
    >
      {dark ? 'Light' : 'Dark'}
    </Button>
  )
}

export function Controls() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Plan my day</Button>
      <Button variant="secondary">Regenerate</Button>
      <Button variant="quiet">Not now</Button>
      <Button variant="danger">Delete project</Button>
      <Button disabled>Saving…</Button>
      <Button size="sm">Small</Button>
    </div>
  )
}

export function Rows() {
  const [capture, setCapture] = useState('')
  const [done, setDone] = useState(false)
  const [stepDone, setStepDone] = useState(false)

  return (
    <div className="space-y-8">
      <CaptureBar value={capture} onChange={setCapture} onSubmit={() => setCapture('')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" placeholder="Tolu Adebayo" />
        <Field label="Email" defaultValue="tolu@" error="Enter the full address, like tolu@example.com." />
      </div>

      <div className="space-y-2">
        <InboxItem
          content="Call Ada about the invoice before Friday"
          state={done ? 'completed' : 'organized'}
          time="2 min ago"
          onToggle={setDone}
          chips={
            <>
              <Chip tone="blue"><ProjectDot tone="blue" />Clients</Chip>
              <Chip>Task</Chip>
              <Chip state="soon">Due Fri</Chip>
            </>
          }
        />
        <InboxItem content="Ask Tunde if the venue takes card" state="organizing" time="now" onToggle={() => {}} />
        <InboxItem content="notes from the call with Kemi" state="failed" time="1 hr ago" onToggle={() => {}} onRetry={() => {}} />
      </div>

      <div className="space-y-2">
        <PlanStep time="08:30" minutes={10} content="Book the meeting room" why="Five minutes now saves a scramble later." done onToggle={() => {}} />
        <PlanStep
          time="09:00"
          minutes={90}
          content="Finish the pitch deck"
          why="Due at 2pm, and it needs your sharpest hours."
          done={stepDone}
          current
          onToggle={setStepDone}
        />
        <PlanStep time="10:45" minutes={15} content="Call Ada about the invoice" why="Quick, and it unblocks Friday’s payment." done={false} onToggle={() => {}} />
      </div>
    </div>
  )
}

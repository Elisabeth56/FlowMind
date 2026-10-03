'use client'

import { useState } from 'react'
import { Button, Field, buttonClass } from '@/components/ui'
import { useApp } from '../../AppProvider'

export default function YourDataPage() {
  const { email, isDemo } = useApp()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const matches = email !== null && typed.trim().toLowerCase() === email.toLowerCase()

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!matches) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: typed }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not delete your account')
      window.location.assign('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-start gap-3 rounded-card bg-surface p-6">
        <h2 className="text-h3">Export</h2>
        <p className="max-w-[60ch] text-body text-ink-2">
          Everything you have put into FlowMind as one JSON file: your profile, items, projects, daily plans and
          weekly reflections.
        </p>
        {/* A plain download link: the browser saves the file the server names */}
        <a
          href="/api/export"
          download
          className={buttonClass({ variant: 'secondary' })}
        >
          Download my data
        </a>
      </section>

      <section className="flex flex-col items-start gap-3 rounded-card bg-surface p-6">
        <h2 className="text-h3">Delete account</h2>
        <p className="max-w-[60ch] text-body text-ink-2">
          Removes your account and everything in it: items, projects, plans, reflections and usage history. A paid
          subscription is stopped first. This cannot be undone, so export first if you want a copy.
        </p>
        {isDemo ? (
          <p className="text-small text-ink-3">Switched off in the shared demo.</p>
        ) : !confirming ? (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete my account…
          </Button>
        ) : (
          <form onSubmit={deleteAccount} className="flex w-full max-w-md flex-col gap-4">
            <Field
              label={`Type ${email ?? 'your email'} to confirm`}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoFocus
              error={deleteError ?? undefined}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={!matches || deleting}>
                {deleting ? 'Deleting…' : 'Delete everything'}
              </Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setConfirming(false)
                  setTyped('')
                  setDeleteError(null)
                }}
              >
                Keep my account
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

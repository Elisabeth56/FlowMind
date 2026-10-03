'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Segmented, Select } from '@/components/ui'
import { readPreferences } from '@/lib/preferences'
import { applyTheme, type ThemeChoice } from '@/lib/theme'
import { useApp } from '../AppProvider'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const THEMES = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

export default function ProfileSettingsPage() {
  const { profile, email, updateProfile, signOut, showToast } = useApp()
  const [form, setForm] = useState({ full_name: '', timezone: 'UTC', daily_plan_time: '08:00', weekly_summary_day: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The profile arrives after the first render; fill the form when it does
  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      timezone: profile.timezone,
      // Postgres returns a time as HH:MM:SS; the input wants HH:MM
      daily_plan_time: profile.daily_plan_time.slice(0, 5),
      weekly_summary_day: profile.weekly_summary_day,
    })
  }, [profile])

  // Every timezone the browser knows, with the stored one included even if it does not
  const timeZones = useMemo(() => {
    const known = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
    return Array.from(new Set(['UTC', ...known, form.timezone])).sort()
  }, [form.timezone])

  const changed =
    profile !== null &&
    (form.full_name !== (profile.full_name ?? '') ||
      form.timezone !== profile.timezone ||
      form.daily_plan_time !== profile.daily_plan_time.slice(0, 5) ||
      form.weekly_summary_day !== profile.weekly_summary_day)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateProfile(form)
      showToast('Saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your changes')
    } finally {
      setSaving(false)
    }
  }

  // The theme saves as soon as it is picked: it is its own preview
  const theme = readPreferences(profile?.preferences).theme
  const chooseTheme = async (choice: ThemeChoice) => {
    applyTheme(choice)
    try {
      await updateProfile({ preferences: { theme: choice } })
    } catch {
      applyTheme(theme)
      showToast('Could not save the theme')
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your settings">
        <div className="flex flex-col gap-5 rounded-card bg-surface p-6">
          {[0, 1, 2].map((key) => (
            <span key={key} className="flex flex-col gap-2">
              <span className="fm-skeleton h-3.5 w-20 rounded-full" />
              <span className="fm-skeleton h-11 rounded-row" />
            </span>
          ))}
        </div>
        <div className="fm-skeleton h-28 rounded-card" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={save} className="flex flex-col gap-5 rounded-card bg-surface p-6">
        <h2 className="text-h3">Profile</h2>
        <Field
          label="Name"
          value={form.full_name}
          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          maxLength={120}
          autoComplete="name"
        />
        <Field label="Email" value={email ?? ''} readOnly disabled hint="The address you sign in with." />
        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={(event) => setForm({ ...form, timezone: event.target.value })}
            hint="Decides what counts as today and when your month of AI actions resets."
          >
            {timeZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll('_', ' ')}
              </option>
            ))}
          </Select>
          <Field
            label="My day starts at"
            type="time"
            value={form.daily_plan_time}
            onChange={(event) => setForm({ ...form, daily_plan_time: event.target.value })}
            hint="Daily plans schedule your first step from here."
          />
          <Select
            label="My week starts on"
            value={form.weekly_summary_day}
            onChange={(event) => setForm({ ...form, weekly_summary_day: Number(event.target.value) })}
            hint="The seven days Insights counts as one week."
          >
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </Select>
        </div>
        {error && (
          <p role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={!changed || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <h2 className="text-h3">Appearance</h2>
        <Segmented label="Theme" value={theme} options={THEMES} onChange={chooseTheme} />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface p-6">
        <p className="text-small text-ink-2">Signed in as {email}</p>
        <Button
          variant="secondary"
          onClick={async () => {
            await signOut()
            window.location.assign('/login')
          }}
        >
          Sign out
        </Button>
      </section>
    </div>
  )
}

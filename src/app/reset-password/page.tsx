'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/app/auth/actions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth'
import { AuthNotice, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell'

// Reached from the link in a reset email, which signs the person in first.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError('The two passwords do not match.')
      return
    }
    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('password', password)
    // On success the action redirects to the inbox and never returns
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    }
  }

  return (
    <AuthShell title="Choose a new password" description={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
      {error && <AuthNotice kind="error">{error}</AuthNotice>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={authInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmation" className="block text-sm font-medium text-slate-700 mb-2">
            Type it again
          </label>
          <input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className={authInputClass}
            required
          />
        </div>
        <button type="submit" disabled={saving} className={authButtonClass}>
          {saving ? 'Saving…' : 'Save password and sign in'}
        </button>
      </form>

      <p className="mt-8 text-sm text-slate-600">
        Link expired?{' '}
        <Link href="/forgot-password" className="text-azure-600 hover:text-azure-700">
          Send a new one
        </Link>
      </p>
    </AuthShell>
  )
}

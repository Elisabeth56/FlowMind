'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/app/auth/actions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth'
import { Button, Field } from '@/components/ui'
import { AuthFooter, AuthNotice, AuthShell } from '@/components/auth/AuthShell'

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Field
          label="Type it again"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save password and sign in'}
        </Button>
      </form>

      <AuthFooter>
        Link expired? <Link href="/forgot-password">Send a new one</Link>
      </AuthFooter>
    </AuthShell>
  )
}

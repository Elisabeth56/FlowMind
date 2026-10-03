'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/app/auth/actions'
import { Button, Field } from '@/components/ui'
import { AuthFooter, AuthNotice, AuthShell } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError('')

    const formData = new FormData()
    formData.append('email', email)
    const result = await resetPassword(formData)

    if (result.error) setError(result.error)
    else setSent(true)
    setSending(false)
  }

  return (
    <AuthShell title="Reset your password" description="Enter your email and we will send you a link to set a new one.">
      {error && <AuthNotice kind="error">{error}</AuthNotice>}

      {sent ? (
        <AuthNotice kind="success">
          If there is an account for {email}, a reset link is on its way. It works for one hour.
        </AuthNotice>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" disabled={sending} className="w-full">
            {sending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <AuthFooter>
        <Link href="/login">Back to sign in</Link>
      </AuthFooter>
    </AuthShell>
  )
}

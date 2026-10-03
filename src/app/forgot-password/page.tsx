'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/app/auth/actions'
import { AuthNotice, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell'

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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={authInputClass}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" disabled={sending} className={authButtonClass}>
            {sending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-slate-600">
        <Link href="/login" className="text-azure-600 hover:text-azure-700">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Field } from '@/components/ui'
import { AuthFooter, AuthNotice, AuthShell, GoogleSignIn } from '@/components/auth/AuthShell'
import { signup } from '@/app/auth/actions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('fullName', fullName)
    formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    // With email confirmation off the action redirects to the inbox and never returns
    const result = await signup(formData)
    if (result?.error) setError(result.error)
    else if (result?.success) setConfirmSent(true)
    setLoading(false)
  }

  if (confirmSent) {
    return (
      <AuthShell title="Check your email" description={`We sent a link to ${email}. Open it to confirm your account and sign in.`}>
        <AuthFooter>
          Wrong address?{' '}
          <button type="button" onClick={() => setConfirmSent(false)} className="text-accent underline underline-offset-2">
            Go back
          </button>
          <span className="mx-2 text-ink-4">·</span>
          <Link href="/login">Sign in</Link>
        </AuthFooter>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" description="Free to start. No card needed.">
      {error && <AuthNotice kind="error">{error}</AuthNotice>}
      <GoogleSignIn onError={setError} />
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field
          label="Name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
      <AuthFooter>
        Already have an account? <Link href="/login">Sign in</Link>
      </AuthFooter>
    </AuthShell>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Field } from '@/components/ui'
import { AuthFooter, AuthNotice, AuthShell, GoogleSignIn } from '@/components/auth/AuthShell'
import { login } from '@/app/auth/actions'
import { LOGIN_NOTICES } from '@/lib/auth'

function Login() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Failures handed back by the Google callback or an expired email link
  useEffect(() => {
    const code = searchParams.get('error')
    if (code) setError(LOGIN_NOTICES[code] ?? LOGIN_NOTICES.auth_failed)
  }, [searchParams])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    // The page the middleware sent them here from
    formData.append('next', searchParams.get('redirect') ?? '')

    // A successful sign-in redirects from the server and never returns
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" description="Sign in to pick up where you left off.">
      {error && <AuthNotice kind="error">{error}</AuthNotice>}
      <GoogleSignIn onError={setError} />
      <form onSubmit={submit} className="flex flex-col gap-5">
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <AuthFooter>
        <Link href="/forgot-password">Forgot your password?</Link>
        <span className="mx-2 text-ink-4">·</span>
        New here? <Link href="/signup">Create an account</Link>
      </AuthFooter>
    </AuthShell>
  )
}

// useSearchParams needs a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}

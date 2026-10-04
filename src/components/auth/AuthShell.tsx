'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Logo, cn } from '@/components/ui'
import { loginWithGoogle } from '@/app/auth/actions'
import { LOGIN_NOTICES } from '@/lib/auth'

/** The frame shared by the auth pages: logo, a heading, one form on a quiet page. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12 text-ink">
      <div className="flex w-full max-w-[440px] flex-col gap-8">
        <Link href="/" className="inline-flex self-start">
          <Logo />
        </Link>
        <div className="flex flex-col gap-6 rounded-card bg-surface p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">{title}</h1>
            <p className="text-body text-ink-2">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}

export function AuthNotice({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-row px-4 py-3 text-small',
        kind === 'error' ? 'bg-danger-tint text-danger' : 'bg-sage-tint text-sage-ink'
      )}
    >
      {children}
    </p>
  )
}

/** The line under a form that leads to the other auth pages. */
export function AuthFooter({ children }: { children: React.ReactNode }) {
  return <p className="text-small text-ink-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2">{children}</p>
}

/** "Continue with Google", followed by the divider before the email form. */
export function GoogleSignIn({ onError }: { onError: (message: string) => void }) {
  const [waiting, setWaiting] = useState(false)

  const start = async () => {
    setWaiting(true)
    try {
      // On success this redirects to Google and never returns
      const result = await loginWithGoogle()
      if (result?.error) {
        onError(result.error)
        setWaiting(false)
      }
    } catch {
      onError(LOGIN_NOTICES.auth_failed)
      setWaiting(false)
    }
  }

  return (
    <>
      <Button variant="secondary" disabled={waiting} onClick={start} className="w-full">
        {waiting ? 'Opening Google…' : 'Continue with Google'}
      </Button>
      <div className="flex items-center gap-4 text-caption text-ink-3" aria-hidden="true">
        <span className="h-px flex-1 bg-hairline" />
        or
        <span className="h-px flex-1 bg-hairline" />
      </div>
    </>
  )
}

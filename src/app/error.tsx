'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-ink">
      <h1 className="text-h2">Something went wrong</h1>
      <p className="text-body text-ink-2">The page could not be shown. Trying again usually fixes it.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}

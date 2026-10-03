'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

// A screen that threw while rendering. The sidebar stays, so the rest of the app is one click away.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex w-full max-w-[720px] flex-col items-start gap-3 px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-h2">This screen hit a problem</h1>
      <p className="text-body text-ink-2">
        Your items are safe. Try the screen again; if it keeps happening, reload the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}

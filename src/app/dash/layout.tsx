'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AppProvider, useApp } from './AppProvider'
import { Palette } from './shell/Palette'
import { Sidebar, TabBar } from './shell/Sidebar'
import { Toast } from './shell/Toast'

/** Keyboard shortcuts that work on every app screen. */
function Shortcuts() {
  const pathname = usePathname()
  const { setPaletteOpen, captureInput } = useApp()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      // N captures, unless the person is typing somewhere
      const target = event.target as HTMLElement
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (event.key.toLowerCase() === 'n' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        if (captureInput.current) captureInput.current.focus()
        else setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, setPaletteOpen, captureInput])

  return null
}

// The signed-in app: a calm sidebar (a tab bar on phones) around one screen at a time.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex min-h-dvh bg-bg text-ink">
        {/* the sidebar reads the URL's query, which needs a Suspense boundary */}
        <Suspense>
          <Sidebar />
        </Suspense>
        <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
        <TabBar />
        <Palette />
        <Toast />
        <Shortcuts />
      </div>
    </AppProvider>
  )
}

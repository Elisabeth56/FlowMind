'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { APP_ROOT_ID, applyTheme } from '@/lib/theme'
import { cn } from './cn'

/**
 * Switches between light and dark. The choice is remembered in this browser;
 * `onChoose` lets a signed-in screen save it to the profile as well.
 */
export function ThemeToggle({ onChoose, className }: { onChoose?: (theme: 'light' | 'dark') => void; className?: string }) {
  // Unknown until mounted: the theme is set on the root element before React runs
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const root = document.getElementById(APP_ROOT_ID)
    if (!root) return
    const read = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')
    read()
    // stay in step when the theme is changed elsewhere (Settings, the device)
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        applyTheme(next)
        onChoose?.(next)
      }}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors duration-200 ease-ui hover:bg-surface-sunk hover:text-ink',
        className
      )}
    >
      {theme && <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />}
    </button>
  )
}

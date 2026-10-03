'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/components/ui'
import { isOpen } from '@/lib/items'
import { useApp } from '../AppProvider'
import { NAV } from './Sidebar'

type Result = { key: string; label: string; hint: string; run: () => void }

/** Cmd/Ctrl+K: capture, search what you saved, or jump somewhere. */
export function Palette() {
  const router = useRouter()
  const { paletteOpen, setPaletteOpen, items, projects, capture } = useApp()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const close = () => {
    setPaletteOpen(false)
    setQuery('')
    setIndex(0)
  }

  const results = useMemo<Result[]>(() => {
    const text = query.trim()
    const needle = text.toLowerCase()
    const go = (href: string) => () => router.push(href)

    const jumps: Result[] = [
      ...NAV.map((item) => ({ key: item.href, label: item.name, hint: 'Go to', run: go(item.href) })),
      { key: '/dash/settings', label: 'Settings', hint: 'Go to', run: go('/dash/settings') },
      ...projects.map((project) => ({
        key: project.id,
        label: project.name,
        hint: 'Project',
        run: go(`/dash?project=${project.id}`),
      })),
    ]
    if (!text) return jumps

    const found: Result[] = items
      .filter((item) => isOpen(item) && item.content.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((item) => ({
        key: item.id,
        label: item.content,
        hint: 'Item',
        run: go(`/dash?find=${encodeURIComponent(text)}`),
      }))

    // What you already saved comes first, so Enter on a search never adds a duplicate
    return [
      ...found,
      { key: 'capture', label: `Add “${text}”`, hint: 'Capture', run: () => void capture(text) },
      ...jumps.filter((jump) => jump.label.toLowerCase().includes(needle)),
    ]
  }, [query, items, projects, capture, router])

  useEffect(() => {
    if (!paletteOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen])

  if (!paletteOpen) return null

  const run = (result: Result | undefined) => {
    if (!result) return
    result.run()
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh]" onClick={close}>
      <div
        role="dialog"
        aria-label="Search or jump"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-card bg-surface shadow-soft"
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setIndex((i) => Math.min(i + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setIndex((i) => Math.max(i - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              run(results[index])
            }
          }}
          placeholder="Type to capture, search or jump"
          aria-label="Capture, search or jump"
          className="min-h-14 w-full border-b border-hairline bg-transparent px-5 text-body text-ink placeholder:text-ink-3 focus:outline-none focus-visible:shadow-none"
        />
        <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((result, i) => (
            <li key={result.key} role="option" aria-selected={i === index}>
              <button
                type="button"
                onClick={() => run(result)}
                onMouseEnter={() => setIndex(i)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-4 rounded-xl px-3 text-left text-small',
                  i === index ? 'bg-surface-sunk text-ink' : 'text-ink-2'
                )}
              >
                <span className="truncate">{result.label}</span>
                <span className="shrink-0 text-caption text-ink-3">{result.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

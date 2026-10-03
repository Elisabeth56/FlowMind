'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ButtonLink, Logo, cn } from '@/components/ui'

const LINKS = [
  { id: 'how', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
]

/** The section the reader is in, so its nav link can carry the apricot dot. */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      // a section counts once it crosses the middle of the screen
      { rootMargin: '-50% 0px -50% 0px' }
    )
    for (const id of ids) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [ids])
  return active
}

const SECTION_IDS = LINKS.map((link) => link.id)

/** A floating pill that lifts once you scroll; on phones the links move into a sheet. */
export function LandingNav() {
  const [open, setOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)

  // Esc closes the menu
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="sticky top-0 z-10">
      <header className="navpill">
        <Link href="/" aria-label="FlowMind home" className="rounded-full">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              className={cn(
                'relative flex min-h-10 items-center rounded-full px-3.5 text-small transition-colors duration-200 ease-ui hover:bg-surface-sunk hover:text-ink',
                active === link.id ? 'text-ink' : 'text-ink-2'
              )}
            >
              {link.label}
              {active === link.id && (
                <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-apricot" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-10 items-center rounded-full px-3.5 text-small text-ink transition-colors duration-200 ease-ui hover:bg-surface-sunk md:flex"
          >
            Sign in
          </Link>
          <span className="hidden md:block">
            <ButtonLink href="/signup" size="sm" className="min-h-10">
              Start for free
            </ButtonLink>
          </span>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
            className="grid size-11 place-items-center rounded-full bg-surface-sunk md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 8h16M4 16h10'} />
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="mx-4 mt-2 flex flex-col gap-1 rounded-3xl bg-surface p-3 shadow-soft md:hidden"
        >
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center rounded-row px-4 text-body text-ink"
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" className="flex min-h-12 items-center rounded-row px-4 text-body text-ink">
            Sign in
          </Link>
          <ButtonLink href="/signup" size="lg" className="mt-1">
            Start for free
          </ButtonLink>
        </nav>
      )}
    </div>
  )
}

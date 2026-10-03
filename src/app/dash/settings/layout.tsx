'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/ui'

const SECTIONS = [
  { name: 'Profile', href: '/dash/settings' },
  { name: 'Billing', href: '/dash/settings/billing' },
  { name: 'Your data', href: '/dash/settings/privacy' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <main className="flex w-full max-w-[816px] flex-col gap-6 px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-h1">Settings</h1>
      <nav aria-label="Settings" className="flex gap-1 overflow-x-auto">
        {SECTIONS.map((section) => {
          const active = pathname === section.href
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-label transition-colors duration-200 ease-ui',
                active ? 'bg-surface text-ink' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'
              )}
            >
              {section.name}
            </Link>
          )
        })}
      </nav>
      {children}
    </main>
  )
}

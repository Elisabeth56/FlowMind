'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BarChart3, Inbox, Plus, Sun } from 'lucide-react'
import { Logo, ProjectDot, cn, projectTone } from '@/components/ui'
import { isOpen } from '@/lib/items'
import { useApp } from '../AppProvider'

export const NAV = [
  { name: 'Inbox', href: '/dash', icon: Inbox },
  { name: 'Today', href: '/dash/today', icon: Sun },
  { name: 'Insights', href: '/dash/insights', icon: BarChart3 },
]

// New projects take the next colour in the palette
const PROJECT_COLOURS = ['#1F3A5F', '#5E7F6A', '#F2B27E', '#7A5C7E']

function NavLink({
  href,
  active,
  count,
  children,
}: {
  href: string
  active: boolean
  count?: number | string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-small transition-colors duration-150',
        active ? 'bg-surface font-medium text-ink' : 'text-ink-2 hover:bg-ink/5 hover:text-ink'
      )}
    >
      {/* apricot marks where you are */}
      {active && <span aria-hidden="true" className="absolute -left-1.5 top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-apricot" />}
      {children}
      {count !== undefined && <span className="ml-auto text-caption text-ink-3">{count}</span>}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const activeProject = useSearchParams().get('project')
  const { items, projects, createProject, usage, profile, showToast, signOut } = useApp()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const openCount = items.filter(isOpen).length

  const addProject = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setAdding(false)
    try {
      await createProject(trimmed, { color: PROJECT_COLOURS[projects.length % PROJECT_COLOURS.length] })
      setName('')
      setAdding(false)
    } catch {
      showToast('You already have a project with that name.')
    }
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 overflow-y-auto bg-surface-sunk px-4 py-5 md:flex">
      <Link href="/dash" className="self-start rounded-full px-2 py-1">
        <Logo />
      </Link>

      <nav aria-label="App" className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            active={pathname === item.href && !activeProject}
            count={item.href === '/dash' ? openCount : undefined}
          >
            <item.icon className="size-[18px]" strokeWidth={1.5} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between px-3 pb-1.5">
          <span className="text-caption text-ink-3">Projects</span>
          <button
            type="button"
            aria-label="New project"
            onClick={() => setAdding(true)}
            className="grid size-6 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
          >
            <Plus className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        {projects.map((project) => (
          <NavLink
            key={project.id}
            href={`/dash?project=${project.id}`}
            active={activeProject === project.id}
            count={project.item_count - project.completed_count || undefined}
          >
            <ProjectDot tone={projectTone(project.color)} />
            <span className="truncate">{project.name}</span>
          </NavLink>
        ))}
        {projects.length === 0 && !adding && (
          <p className="px-3 text-caption text-ink-3">Projects appear as FlowMind files your items.</p>
        )}
        {adding && (
          <form onSubmit={addProject} className="px-1 pt-1">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={addProject}
              onKeyDown={(event) => event.key === 'Escape' && setAdding(false)}
              placeholder="Project name"
              aria-label="Project name"
              maxLength={60}
              className="min-h-10 w-full rounded-xl border border-hairline bg-surface px-3 text-small text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </form>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {usage && usage.limit !== null && (
          <Link href="/dash/settings/billing" className="flex flex-col gap-2 rounded-row bg-surface px-3.5 py-3">
            <span className="text-caption text-ink-2">
              {usage.used} of {usage.limit} AI actions this month
            </span>
            <span className="block h-1 rounded-full bg-surface-sunk">
              <span
                className="block h-1 rounded-full bg-apricot"
                style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
              />
            </span>
          </Link>
        )}
        <NavLink href="/dash/settings" active={pathname.startsWith('/dash/settings')}>
          <span className="grid size-6 place-items-center rounded-full bg-accent-tint text-caption text-accent-tint-ink">
            {(profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
          </span>
          Settings
        </NavLink>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            window.location.assign('/login')
          }}
          className="flex min-h-10 items-center rounded-xl px-3 text-small text-ink-3 hover:bg-ink/5 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

/** Phones get the same destinations as a bar along the bottom. */
export function TabBar() {
  const pathname = usePathname()
  const tabs = [...NAV, { name: 'Settings', href: '/dash/settings', icon: null }]
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around rounded-t-3xl bg-surface-sunk pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.href === '/dash' ? pathname === '/dash' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 text-[11px]',
              active ? 'font-medium text-accent' : 'text-ink-3'
            )}
          >
            {tab.icon ? (
              <tab.icon className="size-[22px]" strokeWidth={1.5} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            )}
            {tab.name}
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

// One place that holds what every app screen shares: the inbox items, projects, AI
// usage, the undo toast and the command palette. Screens read it with useApp().
import { readPreferences } from '@/lib/preferences'
import { applyTheme } from '@/lib/theme'
import { isDemo } from '@/lib/demo'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useInboxItems } from '@/hooks/useInboxItems'
import { useProjects } from '@/hooks/useProjects'
import { quotaFor } from '@/lib/billing/entitlement'
import { safeTimeZone, todayIn } from '@/lib/dates'
import { looksLikeUrl } from '@/lib/items'
import type { InboxItem } from '@/types/models'

type Toast = { id: number; message: string; undo?: () => void }
type Usage = { used: number; limit: number | null }

type AppContext = ReturnType<typeof useInboxItems> &
  Pick<ReturnType<typeof useProjects>, 'projects' | 'createProject' | 'updateProject' | 'deleteProject'> & {
    profile: ReturnType<typeof useAuth>['profile']
    email: string | null
    updateProfile: ReturnType<typeof useAuth>['updateProfile']
    signOut: () => Promise<void>
    timeZone: string
    today: string
    usage: Usage | null
    /** The free plan's AI actions for this month are used up */
    atLimit: boolean
    /** Signed in to the shared demo account */
    isDemo: boolean
    /** The last AI call found no model answering */
    aiDown: boolean
    /** Items the AI is filing right now, and the ones that just landed */
    organizingIds: Set<string>
    settledIds: Set<string>
    capture: (content: string) => Promise<void>
    organize: (ids: string[]) => Promise<void>
    complete: (item: InboxItem) => void
    remove: (item: InboxItem) => void
    toast: Toast | null
    showToast: (message: string, undo?: () => void) => void
    dismissToast: () => void
    paletteOpen: boolean
    setPaletteOpen: (open: boolean) => void
    /** The Inbox registers its capture bar here so N can focus it */
    captureInput: React.RefObject<HTMLInputElement | null>
  }

const Context = createContext<AppContext | null>(null)

export function useApp(): AppContext {
  const value = useContext(Context)
  if (!value) throw new Error('useApp must be used inside the app layout')
  return value
}

const UNDO_MS = 5000

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { user, profile, updateProfile, signOut } = useAuth()
  const inbox = useInboxItems()
  const { projects, createProject, updateProject, deleteProject } = useProjects()
  const { addItem, syncItem, setCompleted, deleteItem } = inbox

  const [usage, setUsage] = useState<Usage | null>(null)
  const [aiDown, setAiDown] = useState(false)
  const [organizingIds, setOrganizingIds] = useState<Set<string>>(new Set())
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<Toast | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const captureInput = useRef<HTMLInputElement | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The stored theme wins over the copy this browser remembered; "system" follows the device live
  const theme = profile ? readPreferences(profile.preferences).theme : null
  useEffect(() => {
    if (!theme) return
    applyTheme(theme)
    const device = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(theme)
    device.addEventListener('change', onChange)
    return () => device.removeEventListener('change', onChange)
  }, [theme])

  const timeZone = safeTimeZone(profile?.timezone)
  const today = todayIn(timeZone)

  // AI usage this month against the plan's limit, straight from the database
  const refreshUsage = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [subscription, units] = await Promise.all([
      supabase.from('subscriptions').select('tier, status').eq('user_id', session.user.id).maybeSingle(),
      supabase.rpc('ai_units_this_month', { p_user_id: session.user.id }),
    ])
    const quota = quotaFor(subscription.data, units.data ?? 0)
    setUsage({ used: quota.used, limit: quota.limit })
  }, [supabase])

  useEffect(() => {
    refreshUsage()
  }, [refreshUsage])

  const atLimit = usage !== null && usage.limit !== null && usage.used >= usage.limit

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, undo })
    toastTimer.current = setTimeout(() => setToast(null), UNDO_MS)
  }, [])

  const mark = (setter: typeof setOrganizingIds, ids: string[], on: boolean) =>
    setter((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const organize = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return
      mark(setOrganizingIds, ids, true)
      try {
        const response = await fetch('/api/items/organize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds: ids }),
        })
        // 503: no model answered. The Inbox shows a banner with a retry instead of a toast per item.
        setAiDown(response.status === 503)
        if (!response.ok && response.status !== 503) {
          const body = await response.json().catch(() => ({}))
          // At the limit the Inbox explains it; anything else is said here
          if (!('limit' in body)) showToast(body.error ?? 'Couldn’t organize that. Try again.')
        }
      } catch {
        showToast('You seem to be offline. It’s saved, and you can organize it later.')
      } finally {
        // The server wrote the filed fields (or marked the item failed): read them back
        await Promise.all(ids.map(syncItem))
        mark(setOrganizingIds, ids, false)
        mark(setSettledIds, ids, true)
        setTimeout(() => mark(setSettledIds, ids, false), 700)
        refreshUsage()
      }
    },
    [syncItem, refreshUsage, showToast]
  )

  // Saved first, organised behind it: the next capture never waits
  const capture = useCallback(
    async (content: string) => {
      const text = content.trim()
      if (!text) return
      try {
        const item = await addItem(text, looksLikeUrl(text) ? 'link' : 'note')
        // Out of AI actions: it is saved, and waits to be organized
        if (!atLimit) void organize([item.id])
      } catch {
        showToast('Couldn’t save that. Check your connection and try again.')
      }
    },
    [addItem, organize, showToast, atLimit]
  )

  const complete = useCallback(
    (item: InboxItem) => {
      const done = item.status !== 'completed'
      setCompleted(item.id, done).catch(() => showToast('Couldn’t save that change.'))
      if (done) showToast('Completed', () => void setCompleted(item.id, false))
    },
    [setCompleted, showToast]
  )

  // Deleting cannot be undone in the database, so it waits out the undo window first
  const { items, setHidden } = useHidden(inbox.items)
  const remove = useCallback(
    (item: InboxItem) => {
      setHidden(item.id, true)
      const timer = setTimeout(() => {
        deleteItem(item.id).catch(() => {
          setHidden(item.id, false)
          showToast('Couldn’t delete that.')
        })
      }, UNDO_MS)
      showToast('Deleted', () => {
        clearTimeout(timer)
        setHidden(item.id, false)
      })
    },
    [deleteItem, setHidden, showToast]
  )

  const value = useMemo<AppContext>(
    () => ({
      ...inbox,
      items,
      projects,
      createProject,
      updateProject,
      deleteProject,
      profile,
      email: user?.email ?? profile?.email ?? null,
      updateProfile,
      signOut,
      timeZone,
      today,
      usage,
      atLimit,
      isDemo: isDemo(profile?.id),
      aiDown,
      organizingIds,
      settledIds,
      capture,
      organize,
      complete,
      remove,
      toast,
      showToast,
      dismissToast,
      paletteOpen,
      setPaletteOpen,
      captureInput,
    }),
    [inbox, items, projects, createProject, updateProject, deleteProject, user, profile, updateProfile, signOut, timeZone, today, usage, atLimit, aiDown, organizingIds, settledIds, capture, organize, complete, remove, toast, showToast, dismissToast, paletteOpen]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/** Items minus the ones waiting out a delete's undo window. */
function useHidden(all: InboxItem[]) {
  const [hidden, setHiddenIds] = useState<Set<string>>(new Set())
  const setHidden = useCallback((id: string, on: boolean) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])
  const items = useMemo(() => all.filter((item) => !hidden.has(item.id)), [all, hidden])
  return { items, setHidden }
}

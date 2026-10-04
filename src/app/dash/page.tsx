'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MoreHorizontal, Search } from 'lucide-react'
import { Button, CaptureBar, Chip, InboxItem as InboxRow, Menu, MenuItem, ProjectDot, cn, projectTone } from '@/components/ui'
import { KINDS, KIND_LABELS, PRIORITY_LABELS, countByKind, dueLabel, isOpen, relativeTime } from '@/lib/items'
import type { InboxItem } from '@/types/models'
import { useApp } from './AppProvider'
import { LimitNotice } from './shell/LimitNotice'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'task', label: 'Tasks' },
  { id: 'note', label: 'Notes' },
  { id: 'idea', label: 'Ideas' },
  { id: 'link', label: 'Links' },
  { id: 'reminder', label: 'Reminders' },
  { id: 'done', label: 'Done' },
]

// The filter is remembered between visits
const FILTER_KEY = 'flowmind.inbox.filter'

function Inbox() {
  const router = useRouter()
  const params = useSearchParams()
  const projectId = params.get('project')
  const find = params.get('find')?.toLowerCase() ?? ''
  const app = useApp()
  const { items, projects, loading, error, refetch, capture, captureInput, setPaletteOpen } = app

  const [draft, setDraft] = useState('')
  const [tab, setTab] = useState('all')
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(FILTER_KEY)
    if (saved && TABS.some((t) => t.id === saved)) setTab(saved)
  }, [])
  const chooseTab = (id: string) => {
    setTab(id)
    window.localStorage.setItem(FILTER_KEY, id)
  }

  const project = projects.find((p) => p.id === projectId)
  // Everything below is scoped to the project or search the URL names
  const scoped = useMemo(
    () =>
      items.filter(
        (item) =>
          (!projectId || item.project_id === projectId) && (!find || item.content.toLowerCase().includes(find))
      ),
    [items, projectId, find]
  )
  const counts = countByKind(scoped)
  const doneCount = scoped.filter((item) => item.status === 'completed').length
  const visible = scoped.filter((item) =>
    tab === 'done' ? item.status === 'completed' : isOpen(item) && (tab === 'all' || item.item_type === tab)
  )
  const waiting = scoped.filter((item) => isOpen(item) && item.ai_status === 'pending' && !app.organizingIds.has(item.id))

  // What a retry picks up after the AI was down: never organized, or tried and failed
  const retryable = items.filter((item) => isOpen(item) && item.ai_status !== 'done' && !app.organizingIds.has(item.id))

  const submit = () => {
    void capture(draft)
    setDraft('')
  }

  return (
    <main className="flex w-full max-w-[880px] flex-col gap-6 px-4 py-6 md:px-12 md:py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {project && renaming ? (
            <RenameProject project={project} onDone={() => setRenaming(false)} />
          ) : (
            <h1 className="truncate text-h2">{project ? project.name : find ? `“${find}”` : 'Inbox'}</h1>
          )}
          {project && !renaming && <ProjectActions project={project} onRename={() => setRenaming(true)} />}
          {(project || find) && (
            <Button variant="quiet" size="sm" onClick={() => router.push('/dash')}>
              Show everything
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-full bg-surface-sunk px-3.5 text-small text-ink-2 hover:text-ink max-md:size-11 max-md:justify-center max-md:px-0"
        >
          <Search className="size-[18px] md:hidden" strokeWidth={1.5} aria-hidden="true" />
          <span className="max-md:sr-only">Search or jump</span>
          <kbd className="rounded-md bg-surface px-1.5 py-0.5 font-sans text-caption text-ink-3 max-md:hidden">⌘K</kbd>
        </button>
      </header>

      {/* on phones the capture bar floats above the tab bar, within thumb reach */}
      <div className="max-md:fixed max-md:inset-x-4 max-md:bottom-20 max-md:z-20">
        <CaptureBar
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          inputRef={captureInput}
          placeholder="Drop in a task, note, link or idea"
        />
      </div>

      <div role="tablist" aria-label="Filter" className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const count = t.id === 'done' ? doneCount : (counts[t.id] ?? 0)
          // empty kinds stay out of the way, except the one you are on
          if (count === 0 && t.id !== 'all' && t.id !== tab) return null
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => chooseTab(t.id)}
              className={cn(
                'min-h-9 shrink-0 rounded-full px-3.5 text-small transition-colors duration-150',
                tab === t.id ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-surface-sunk'
              )}
            >
              {t.label} · {count}
            </button>
          )
        })}
        {waiting.length > 1 && !app.atLimit && (
          <Button variant="secondary" size="sm" className="ml-auto shrink-0" onClick={() => app.organize(waiting.map((i) => i.id))}>
            Organize {waiting.length}
          </Button>
        )}
      </div>

      {app.atLimit && <LimitNotice what="Organizing and planning" />}
      {app.aiDown && !app.atLimit && (
        <div role="status" className="rounded-row bg-apricot-tint px-4 py-3 text-small text-ink">
          The AI isn’t answering right now. What you add is saved and waits as not organized.{' '}
          <button
            type="button"
            onClick={() => app.organize(retryable.map((item) => item.id))}
            className="text-apricot-ink underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
          Couldn’t load your inbox.{' '}
          <button type="button" onClick={refetch} className="underline underline-offset-2">
            Try again
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <Empty tab={tab} scoped={Boolean(project || find)} onCapture={() => captureInput.current?.focus()} />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item) => (
            <li key={item.id}>
              <Row item={item} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function Row({ item }: { item: InboxItem }) {
  const app = useApp()
  const { projects, today, timeZone, updateItem, showToast } = app
  const project = projects.find((p) => p.id === item.project_id)
  const saved = !item.id.startsWith('temp-')
  const organizing = !saved || app.organizingIds.has(item.id)
  const due = item.due_date ? dueLabel(item.due_date, today) : null

  // Chips for things an item does not have (no project, no date) stay out of the way
  // until the row is hovered, focused or opened for editing from its menu
  const [editing, setEditing] = useState(false)
  const quiet = cn(!editing && 'max-md:hidden md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100')

  const change = (updates: Partial<InboxItem>) =>
    updateItem(item.id, updates).catch(() => showToast('Couldn’t save that change.'))

  const state =
    item.status === 'completed' ? 'completed' : organizing ? 'organizing' : item.ai_status === 'failed' ? 'failed' : 'organized'

  return (
    <div className={cn('group relative', app.settledIds.has(item.id) && 'fm-settle')}>
      <InboxRow
        content={item.content}
        state={state}
        time={relativeTime(item.created_at, timeZone)}
        onToggle={() => saved && app.complete(item)}
        onRetry={() => app.organize([item.id])}
        chips={
          <>
            {/* every chip the AI filed can be changed with a click; missing ones sit last */}
            <span className={cn('inline-flex', !project && 'order-last')}>
            <Menu
              label="Change project"
              trigger={
                project ? (
                  <Chip tone={projectTone(project.color)}>
                    <ProjectDot tone={projectTone(project.color)} />
                    {project.name}
                  </Chip>
                ) : (
                  <Chip className={cn('text-ink-3', quiet)}>Add project</Chip>
                )
              }
            >
              {(close) => (
                <>
                  {projects.map((p) => (
                    <MenuItem key={p.id} selected={p.id === item.project_id} onSelect={() => (change({ project_id: p.id }), close())}>
                      <ProjectDot tone={projectTone(p.color)} />
                      {p.name}
                    </MenuItem>
                  ))}
                  <MenuItem selected={!item.project_id} onSelect={() => (change({ project_id: null }), close())}>
                    No project
                  </MenuItem>
                </>
              )}
            </Menu>
            </span>

            <Menu
              label="Change kind and priority"
              trigger={
                <Chip tone={item.item_type === 'idea' ? 'apricot' : item.item_type === 'task' ? 'blue' : 'neutral'}>
                  {KIND_LABELS[item.item_type] ?? item.item_type}
                  {item.priority === 3 && ' · High'}
                </Chip>
              }
            >
              {(close) => (
                <>
                  {KINDS.map((kind) => (
                    <MenuItem key={kind} selected={kind === item.item_type} onSelect={() => (change({ item_type: kind }), close())}>
                      {KIND_LABELS[kind]}
                    </MenuItem>
                  ))}
                  <span className="mx-2 my-1 h-px bg-hairline" />
                  {PRIORITY_LABELS.map((label, priority) => (
                    <MenuItem key={label} selected={priority === item.priority} onSelect={() => (change({ priority }), close())}>
                      {label}
                    </MenuItem>
                  ))}
                </>
              )}
            </Menu>

            <DueChip due={due} value={item.due_date} onChange={(due_date) => change({ due_date })} className={quiet} />

            {item.ai_status === 'pending' && item.status !== 'completed' && !app.atLimit && (
              <button type="button" onClick={() => app.organize([item.id])} className="text-caption text-accent underline underline-offset-2">
                Organize
              </button>
            )}
          </>
        }
      />
      {saved && (
        <div className="absolute right-2 top-9">
          <Menu
            label="More"
            align="right"
            trigger={
              <span className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-sunk hover:text-ink">
                <MoreHorizontal className="size-4" strokeWidth={1.5} />
              </span>
            }
          >
            {(close) => (
              <>
                <MenuItem onSelect={() => (setEditing(true), close())}>Edit project and date</MenuItem>
                <MenuItem onSelect={() => (app.organize([item.id]), close())}>Organize again</MenuItem>
                <MenuItem danger onSelect={() => (app.remove(item), close())}>
                  Delete
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      )}
    </div>
  )
}

/** The due date as a chip. Clicking it opens the browser's date picker. */
function DueChip({
  due,
  value,
  onChange,
  className,
}: {
  due: ReturnType<typeof dueLabel> | null
  value: string | null
  onChange: (date: string | null) => void
  /** How to show the chip when there is no date yet */
  className?: string
}) {
  return (
    <label className={cn('relative inline-flex cursor-pointer', !due && 'order-last', !due && className)}>
      <Chip state={due?.state} className={cn(!due && 'text-ink-3')}>
        {due?.label ?? 'Add date'}
      </Chip>
      <input
        type="date"
        aria-label="Due date"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        onClick={(event) => event.currentTarget.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}

/** The project's title, editable in place. Enter or leaving the field saves; Esc cancels. */
function RenameProject({ project, onDone }: { project: { id: string; name: string }; onDone: () => void }) {
  const { updateProject, showToast } = useApp()
  const [name, setName] = useState(project.name)

  const save = async () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== project.name) {
      await updateProject(project.id, { name: trimmed }).catch(() =>
        showToast('You already have a project with that name.')
      )
    }
    onDone()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => event.key === 'Escape' && onDone()}
        aria-label="Project name"
        maxLength={60}
        className="w-64 max-w-full rounded-row border border-accent bg-surface px-3 py-1 text-h3 text-ink focus:outline-none"
      />
    </form>
  )
}

function ProjectActions({ project, onRename }: { project: { id: string; name: string }; onRename: () => void }) {
  const router = useRouter()
  const { deleteProject, showToast } = useApp()

  const remove = async () => {
    await deleteProject(project.id)
      .then(() => {
        router.push('/dash')
        showToast(`Deleted ${project.name}. Its items are still in your inbox.`)
      })
      .catch(() => showToast('Couldn’t delete that project.'))
  }

  return (
    <Menu
      label="Project actions"
      trigger={
        <span className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-surface-sunk hover:text-ink">
          <MoreHorizontal className="size-[18px]" strokeWidth={1.5} />
        </span>
      }
    >
      {(close) => (
        <>
          <MenuItem onSelect={() => (close(), onRename())}>Rename</MenuItem>
          <MenuItem danger onSelect={() => (close(), void remove())}>
            Delete project
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

// Shaped like the rows it stands in for
function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Loading your inbox">
      {[72, 56, 64, 48].map((width) => (
        <li key={width} className="flex gap-4 rounded-row bg-surface px-4 py-4">
          <span className="fm-skeleton size-5 rounded-control" />
          <span className="flex flex-1 flex-col gap-2.5">
            <span className="fm-skeleton h-4 rounded-full" style={{ width: `${width}%` }} />
            <span className="fm-skeleton h-5 w-36 rounded-full" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Empty({ tab, scoped, onCapture }: { tab: string; scoped: boolean; onCapture: () => void }) {
  const done = tab === 'done'
  return (
    <div className="flex flex-col items-start gap-3 rounded-card bg-surface px-6 py-8">
      <h2 className="text-h3">{done ? 'Nothing finished yet' : scoped || tab !== 'all' ? 'Nothing here' : 'Your inbox is clear'}</h2>
      <p className="max-w-[48ch] text-body text-ink-2">
        {done
          ? 'Tick something off and it will be kept here.'
          : 'Drop in whatever is on your mind. A task, a note, a link, half an idea. FlowMind files it for you.'}
      </p>
      {!done && (
        <Button variant="secondary" onClick={onCapture}>
          Add something
        </Button>
      )}
    </div>
  )
}

// useSearchParams needs a Suspense boundary during the build
export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  )
}

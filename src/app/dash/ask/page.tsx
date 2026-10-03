'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, cn } from '@/components/ui'
import { answerParts } from '@/lib/ask'
import { KIND_LABELS, relativeTime } from '@/lib/items'
import { proMonthlyPrice } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '../AppProvider'

type Source = { n: number; id: string; content: string; item_type: string; project_name: string | null; created_at: string }
type Turn = {
  id: number
  question: string
  /** undefined while the answer is being written */
  answer?: { found: boolean; text: string; sources: Source[] }
  error?: string
}

const STARTERS = ['What did I say I would send this week?', 'What is still open for my clients?', 'What ideas have I saved?']

export default function AskPage() {
  const app = useApp()
  const { usage, items, timeZone, capture, showToast } = app
  const isPro = usage !== null && usage.limit === null

  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [indexing, setIndexing] = useState(false)
  // Resolves when every item has an embedding, so a question never searches a half-read inbox
  const indexed = useRef<Promise<void> | null>(null)
  const bottom = useRef<HTMLDivElement | null>(null)

  // Embed whatever has been added or edited since the last visit, a batch at a time
  useEffect(() => {
    if (!isPro || indexed.current) return
    const supabase = createClient()
    indexed.current = (async () => {
      for (let batch = 0; batch < 40; batch++) {
        const { data, error } = await supabase.functions.invoke('embed', { body: {} })
        if (error || !data?.remaining) break
        setIndexing(true)
      }
      setIndexing(false)
    })()
  }, [isPro])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  const ask = async (question: string, id = Date.now()) => {
    const text = question.trim()
    if (!text) return
    setDraft('')
    setTurns((all) => [...all.filter((turn) => turn.id !== id), { id, question: text }])
    const settle = (result: Partial<Turn>) =>
      setTurns((all) => all.map((turn) => (turn.id === id ? { ...turn, ...result } : turn)))

    try {
      await indexed.current
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not answer that. Try again.')
      settle({ answer: { found: data.found, text: data.answer, sources: data.sources } })
    } catch (err) {
      settle({ error: err instanceof Error ? err.message : 'Could not answer that. Try again.' })
    }
  }

  const busy = turns.some((turn) => !turn.answer && !turn.error)

  if (usage !== null && !isPro) {
    return (
      <main className="flex w-full max-w-[820px] flex-col gap-6 px-4 py-6 md:px-12 md:py-8">
        <h1 className="text-h2">Ask your notes</h1>
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface px-6 py-8">
          <h2 className="text-h3">Get things back out</h2>
          <p className="max-w-[56ch] text-body text-ink-2">
            Ask a question in your own words and get an answer from what you have saved, with the notes it came from
            linked beside it. If the answer is not in your notes, it says so.
          </p>
          <ButtonLink href="/dash/settings/billing">Go Pro · {proMonthlyPrice('monthly')} a month</ButtonLink>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100dvh-6rem)] w-full max-w-[820px] flex-col gap-6 px-4 py-6 md:min-h-dvh md:px-12 md:py-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-h2">Ask your notes</h1>
        {indexing && <span role="status" className="text-caption text-ink-3">Reading your new notes…</span>}
      </header>

      {turns.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-card bg-surface px-6 py-8">
          <p className="max-w-[56ch] text-body text-ink-2">
            {items.length === 0
              ? 'There is nothing to ask about yet. Add a few things to your inbox first.'
              : 'Ask in your own words. The answer comes only from what you have saved, with the notes it used beside it.'}
          </p>
          {items.length === 0 ? (
            <Link href="/dash" className="text-small text-accent underline underline-offset-2">
              Go to the inbox
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <Button key={starter} variant="secondary" size="sm" onClick={() => ask(starter)}>
                  {starter}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ol className="flex flex-col gap-4" aria-live="polite">
          {turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-4">
              <p className="max-w-[80%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-3 text-body text-accent-tint-ink">
                {turn.question}
              </p>
              {turn.error ? (
                <div role="alert" className="rounded-row bg-danger-tint px-4 py-3 text-small text-danger">
                  {turn.error}{' '}
                  <button type="button" onClick={() => ask(turn.question, turn.id)} className="underline underline-offset-2">
                    Try again
                  </button>
                </div>
              ) : !turn.answer ? (
                <div className="flex flex-col gap-2.5 rounded-card bg-surface p-6" aria-busy="true" aria-label="Looking through your notes">
                  <span className="fm-skeleton h-4 w-10/12 rounded-full" />
                  <span className="fm-skeleton h-4 w-7/12 rounded-full" />
                </div>
              ) : (
                <Answer
                  turn={turn}
                  answer={turn.answer}
                  timeZone={timeZone}
                  onCopy={() =>
                    navigator.clipboard
                      .writeText(turn.answer!.text.replace(/ ?\[\d+\]/g, ''))
                      .then(() => showToast('Copied'), () => showToast('Couldn’t copy that.'))
                  }
                  onSave={() => capture(turn.question).then(() => showToast('Saved to your inbox'))}
                />
              )}
            </li>
          ))}
        </ol>
      )}
      <div ref={bottom} />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy) void ask(draft)
        }}
        className="sticky bottom-24 mt-auto flex items-center gap-2 rounded-row bg-surface py-2 pl-4 pr-2 shadow-soft focus-within:shadow-[var(--fm-shadow-soft),var(--fm-shadow-focus)] md:bottom-8"
      >
        <label htmlFor="question" className="sr-only">
          Question
        </label>
        <input
          id="question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder="Ask anything you’ve saved"
          className="min-h-10 flex-1 bg-transparent text-body text-ink placeholder:text-ink-3 focus:shadow-none focus:outline-none"
        />
        <Button type="submit" size="sm" disabled={busy || draft.trim().length < 2}>
          Ask
        </Button>
      </form>
    </main>
  )
}

function Answer({
  turn,
  answer,
  timeZone,
  onCopy,
  onSave,
}: {
  turn: Turn
  answer: NonNullable<Turn['answer']>
  timeZone: string
  onCopy: () => void
  onSave: () => void
}) {
  const anchor = (n: number) => `ask-${turn.id}-${n}`
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <p className="text-body leading-[1.65]">
        {answerParts(answer.text).map((part, i) =>
          'text' in part ? (
            <span key={i}>{part.text}</span>
          ) : (
            <a
              key={i}
              href={`#${anchor(part.cite)}`}
              aria-label={`Source ${part.cite}`}
              className="mx-0.5 rounded-md bg-apricot-tint px-1.5 py-px text-caption text-apricot-ink"
            >
              {part.cite}
            </a>
          )
        )}
      </p>

      {answer.sources.length > 0 && (
        <ul className={cn('grid gap-2', answer.sources.length > 1 && 'md:grid-cols-2')}>
          {answer.sources.map((source) => (
            <li key={source.n}>
              {/* opens the inbox filtered to this item */}
              <Link
                id={anchor(source.n)}
                href={`/dash?find=${encodeURIComponent(source.content.slice(0, 60))}`}
                className="flex h-full flex-col gap-1 rounded-row bg-bg px-4 py-3 transition-colors duration-200 hover:bg-surface-sunk target:bg-apricot-tint"
              >
                <span className="text-caption text-ink-3">
                  <b className="font-medium text-apricot-ink">{source.n}</b> · {KIND_LABELS[source.item_type] ?? source.item_type}
                  {source.project_name && ` · ${source.project_name}`} · {relativeTime(source.created_at, timeZone)}
                </span>
                <span className="text-small leading-normal [overflow-wrap:anywhere]">{source.content}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {answer.found ? (
          <Button variant="secondary" size="sm" onClick={onCopy}>
            Copy answer
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onSave}>
            Save the question to my inbox
          </Button>
        )}
      </div>
    </div>
  )
}

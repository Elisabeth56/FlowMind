'use client'

import { useState, useCallback } from 'react'
import type { OrganizedItem } from '@/lib/ai/organize'

export interface DailyPlanItem {
  item_id: string
  scheduled_time: string | null
  duration_minutes: number | null
  notes: string | null
  item: {
    id: string
    content: string
    status: string
    priority: number
  } | null
}

export interface DailyPlan {
  /** Absent while the plan is still being written */
  id?: string
  plan_date?: string
  reasoning: string
  energy_recommendation: string
  plan_items: DailyPlanItem[]
  items_total: number
  items_completed: number
  status: 'active' | 'completed'
}

export interface WeeklySummary {
  id: string
  week_start: string
  week_end: string
  items_created: number
  items_completed: number
  items_carried_over: number
  summary_text: string
  accomplishments: string[]
  /** Share of planned steps done; null when the week had no daily plans */
  plan_completion_rate: number | null
  project_counts: Array<{ name: string; completed: number }>
  productivity_trend: 'improving' | 'stable' | 'declining' | null
  keep: string | null
  try_next: string | null
}

type PlanEvent =
  | { type: 'partial'; plan: DailyPlan }
  | { type: 'done'; plan: DailyPlan | null; degraded: boolean }
  | { type: 'error'; error: string }

/** Reads a newline-delimited JSON response, calling `onEvent` for each line as it arrives. */
async function readJsonLines(body: ReadableStream<Uint8Array>, onEvent: (event: PlanEvent) => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffered = ''
  for (;;) {
    const { value, done } = await reader.read()
    buffered += decoder.decode(value, { stream: !done })
    const lines = buffered.split('\n')
    buffered = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line))
    if (done) break
  }
}

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Organize a single item or batch
  const organize = useCallback(async (
    input: { itemIds: string[] }
  ): Promise<Record<string, OrganizedItem> | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/items/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to organize')
      }

      return data.organized
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Load today's plan if one already exists (never spends an AI call)
  const loadDailyPlan = useCallback(async (): Promise<DailyPlan | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/daily-plan')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load plan')
      }

      return data.plan
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate (or regenerate) today's plan. The server streams it as JSON lines:
  // `onPartial` gets the plan as the model writes it, the promise resolves to the saved plan.
  const generateDailyPlan = useCallback(async (
    options?: { regenerate?: boolean; onPartial?: (plan: DailyPlan) => void }
  ): Promise<DailyPlan | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: options?.regenerate ? 'regenerate' : 'generate',
        }),
      })

      // Refusals and an already-existing plan come back as plain JSON
      if (!response.headers.get('Content-Type')?.includes('ndjson') || !response.body) {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to generate plan')
        return data.plan
      }

      let saved: DailyPlan | null = null
      await readJsonLines(response.body, (event) => {
        if (event.type === 'partial') options?.onPartial?.(event.plan)
        if (event.type === 'done') saved = event.plan
        if (event.type === 'error') throw new Error(event.error)
      })
      return saved
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Tick a planned item off (or back on)
  const setPlanItemCompleted = useCallback(async (
    itemId: string,
    completed: boolean
  ): Promise<DailyPlan | null> => {
    setError(null)

    try {
      const response = await fetch('/api/daily-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, completed }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update plan')
      }

      return data.plan
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [])

  // Ask a question about the day
  const askAboutDay = useCallback(async (question: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ask', question }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer')
      }

      return data.answer
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Read an existing weekly summary (no AI call)
  const loadWeeklySummary = useCallback(async (
    weekOffset = 0
  ): Promise<WeeklySummary | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/weekly-summary?weekOffset=${weekOffset}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load summary')
      }

      return data.summary
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate weekly summary. `empty` means the week had nothing in it to reflect on.
  const getWeeklySummary = useCallback(async (
    weekOffset = 0
  ): Promise<WeeklySummary | 'empty' | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekOffset }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      if (data.empty) return 'empty'
      return data.summary
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get past summaries
  const getPastSummaries = useCallback(async (
    limit = 4
  ): Promise<WeeklySummary[]> => {
    try {
      const response = await fetch(`/api/weekly-summary?limit=${limit}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get summaries')
      }

      return data.summaries || []
    } catch (err) {
      console.error('Failed to get past summaries:', err)
      return []
    }
  }, [])

  return {
    loading,
    error,
    organize,
    loadDailyPlan,
    generateDailyPlan,
    setPlanItemCompleted,
    askAboutDay,
    loadWeeklySummary,
    getWeeklySummary,
    getPastSummaries,
  }
}

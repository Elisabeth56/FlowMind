'use client'

import { useState, useCallback } from 'react'

export interface OrganizedItem {
  item_type: 'note' | 'task' | 'idea' | 'reminder' | 'link'
  is_actionable: boolean
  priority: number
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  extracted_entities: Array<{ type: string; value: string }>
  extracted_topics: string[]
  suggested_project: string | null
  due_date: string | null
  summary: string
}

export interface DailyPlanItem {
  item_id: string
  scheduled_time: string
  duration_minutes: number
  notes: string
  item: {
    id: string
    content: string
    status: string
    priority: number
  } | null
}

export interface DailyPlan {
  id: string
  plan_date: string
  reasoning: string
  energy_recommendation: string
  plan_items: DailyPlanItem[]
  items_total: number
  items_completed: number
  status: 'active' | 'completed' | 'skipped'
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
  patterns: Array<{ pattern: string; type: string; evidence: string }>
  suggestions: Array<{ suggestion: string; priority: string; effort: string }>
  productivity_trend: 'improving' | 'stable' | 'declining'
  focus_score: number
}

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Organize a single item or batch
  const organize = useCallback(async (
    input: { content: string } | { itemIds: string[] }
  ): Promise<OrganizedItem | Record<string, OrganizedItem> | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/organize', {
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

  // Generate (or regenerate) today's plan
  const generateDailyPlan = useCallback(async (
    options?: { regenerate?: boolean }
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan')
      }

      return data.plan
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

  // Generate weekly summary
  const getWeeklySummary = useCallback(async (
    weekOffset = 0
  ): Promise<WeeklySummary | null> => {
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

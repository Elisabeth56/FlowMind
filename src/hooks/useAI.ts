'use client'

import { useState, useCallback } from 'react'

interface OrganizedItem {
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

interface DailyPlan {
  id: string
  plan_date: string
  reasoning: string
  energy_recommendation: string
  plan_items: Array<{
    item_id: string
    scheduled_time: string
    duration_minutes: number
    notes: string
    item?: {
      id: string
      content: string
      status: string
      priority: number
    }
  }>
  items_total: number
  items_completed: number
  status: 'active' | 'completed' | 'skipped'
}

interface WeeklySummary {
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

  // Generate or get daily plan
  const getDailyPlan = useCallback(async (
    options?: { regenerate?: boolean }
  ): Promise<DailyPlan | null> => {
    setLoading(true)
    setError(null)

    try {
      // First try to get existing plan
      if (!options?.regenerate) {
        const getResponse = await fetch('/api/daily-plan')
        const getData = await getResponse.json()
        
        if (getData.plan) {
          setLoading(false)
          return getData.plan
        }
      }

      // Generate new plan
      const response = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: options?.regenerate ? 'regenerate' : 'generate' 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan')
      }

      return data.plan
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
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
    getDailyPlan,
    askAboutDay,
    getWeeklySummary,
    getPastSummaries,
  }
}

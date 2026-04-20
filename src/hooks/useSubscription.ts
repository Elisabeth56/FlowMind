'use client'

import { useState, useEffect, useCallback } from 'react'

interface Subscription {
  code: string
  status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled'
  plan: {
    plan_code: string
    name: string
    interval: string
    amount: number
  }
  amount: number
  next_payment_date: string
  created_at: string
}

interface SubscriptionData {
  subscription: Subscription | null
  tier: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'non_renewing' | null
  limits: {
    ai_calls_per_month: number | 'unlimited'
    ai_calls_used: number
    ai_calls_remaining: number | 'unlimited'
  }
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/subscription')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch subscription')
      }

      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Start checkout flow
  const checkout = useCallback(async (plan: 'pro_monthly' | 'pro_yearly' = 'pro_monthly') => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start checkout')
      }

      // Redirect to Paystack checkout
      window.location.href = result.authorization_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [])

  // Cancel subscription
  const cancel = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription')
      }

      await fetchSubscription()
      return result.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSubscription])

  // Reactivate subscription
  const reactivate = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reactivate subscription')
      }

      await fetchSubscription()
      return result.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSubscription])

  return {
    subscription: data?.subscription || null,
    tier: data?.tier || 'free',
    status: data?.status || null,
    limits: data?.limits || null,
    loading,
    error,
    checkout,
    cancel,
    reactivate,
    refresh: fetchSubscription,
    isPro: data?.tier === 'pro' || data?.tier === 'enterprise',
    isActive: data?.status === 'active',
  }
}

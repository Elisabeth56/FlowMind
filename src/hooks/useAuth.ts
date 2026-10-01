'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/models'
import { isPro as isProPlan } from '@/lib/billing/entitlement'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const [{ data }, { data: subscription }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      // Row level security returns only the user's own row; no row means the free plan
      supabase.from('subscriptions').select('tier, status').eq('user_id', userId).maybeSingle(),
    ])

    if (data) {
      setProfile(data)
    }
    setIsPro(isProPlan(subscription))
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsPro(false)
    setSession(null)
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  /** Persist preference changes and keep the cached profile in step. */
  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, 'full_name' | 'timezone' | 'daily_plan_time' | 'weekly_summary_day'>>) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setProfile(result.profile)
      return result.profile as Profile
    },
    []
  )

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
    updateProfile,
    isAuthenticated: !!user,
    isPro,
  }
}

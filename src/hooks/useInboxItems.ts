'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InboxItem, NewInboxItem } from '@/types/models'
import type { RealtimeChannel } from '@supabase/supabase-js'

type InboxFilter = 'all' | 'inbox' | 'organized' | 'completed'

export function useInboxItems(filter: InboxFilter = 'all') {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('inbox_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }, [supabase, filter])

  // Add new item. It appears at once under a temporary id and is swapped for the
  // saved row when the insert returns, so capture never waits on the network.
  const addItem = async (content: string, itemType: InboxItem['item_type'] = 'note') => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    const tempId = `temp-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const optimistic = {
      id: tempId,
      user_id: user.id,
      content,
      item_type: itemType,
      status: 'inbox',
      ai_status: 'pending',
      priority: 0,
      is_actionable: false,
      tags: [],
      extracted_entities: [],
      project_id: null,
      due_date: null,
      sentiment: null,
      organized_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    } as InboxItem
    setItems((prev) => [optimistic, ...prev])

    const newItem: NewInboxItem = { user_id: user.id, content, item_type: itemType, status: 'inbox' }
    const { data, error } = await supabase.from('inbox_items').insert(newItem).select().single()

    if (error) {
      setItems((prev) => prev.filter((item) => item.id !== tempId))
      throw error
    }
    // Realtime may have delivered the saved row already; keep exactly one copy
    setItems((prev) => [data, ...prev.filter((item) => item.id !== tempId && item.id !== data.id)])
    return data
  }

  // Update item: shown at once, put back if the save fails
  const updateItem = async (id: string, updates: Partial<InboxItem>) => {
    const before = items.find((item) => item.id === id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))

    const { data, error } = await supabase.from('inbox_items').update(updates).eq('id', id).select().single()

    if (error) {
      if (before) setItems((prev) => prev.map((item) => (item.id === id ? before : item)))
      throw error
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))
    return data
  }

  // Re-read one item, for changes the server made (organising writes its fields there)
  const syncItem = async (id: string) => {
    const { data } = await supabase.from('inbox_items').select('*').eq('id', id).maybeSingle()
    if (data) setItems((prev) => prev.map((item) => (item.id === id ? data : item)))
  }

  // Delete item
  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('inbox_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Complete item, or put it back
  const setCompleted = async (id: string, completed: boolean) => {
    return updateItem(id, {
      status: completed ? 'completed' : 'organized',
      completed_at: completed ? new Date().toISOString() : null,
    })
  }

  // Realtime subscription
  useEffect(() => {
    fetchItems()

    let channel: RealtimeChannel | null = null
    let active = true

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || !active) return

      const channelName = `inbox_items_changes_${Date.now()}`
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inbox_items',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as InboxItem
              setItems((prev) => {
                // Avoid duplicates from optimistic updates
                if (prev.some((item) => item.id === newItem.id)) {
                  return prev
                }
                return [newItem, ...prev]
              })
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as InboxItem
              setItems((prev) =>
                prev.map((item) =>
                  item.id === updatedItem.id ? updatedItem : item
                )
              )
            } else if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as { id: string }
              setItems((prev) =>
                prev.filter((item) => item.id !== deletedItem.id)
              )
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      active = false
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [supabase, fetchItems])

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    setCompleted,
    syncItem,
    refetch: fetchItems,
  }
}

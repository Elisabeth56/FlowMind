'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InboxItem, NewInboxItem } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type InboxFilter = 'all' | 'inbox' | 'organized' | 'completed'

export function useInboxItems(filter: InboxFilter = 'all') {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

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

  // Add new item
  const addItem = async (content: string, itemType: InboxItem['item_type'] = 'note') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const newItem: NewInboxItem = {
      user_id: user.id,
      content,
      item_type: itemType,
      status: 'inbox',
    }

    const { data, error } = await supabase
      .from('inbox_items')
      .insert(newItem)
      .select()
      .single()

    if (error) throw error

    // Optimistic update - item will also come through realtime
    setItems((prev) => [data, ...prev])

    return data
  }

  // Update item
  const updateItem = async (id: string, updates: Partial<InboxItem>) => {
    const { data, error } = await supabase
      .from('inbox_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    )

    return data
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

  // Complete item
  const completeItem = async (id: string) => {
    return updateItem(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  // Realtime subscription
  useEffect(() => {
    fetchItems()

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('inbox_items_changes')
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
      if (channel) {
        supabase.removeChannel(channel)
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
    completeItem,
    refetch: fetchItems,
  }
}

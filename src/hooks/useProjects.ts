'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, NewProject } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProjects(data || [])
    }

    setLoading(false)
  }, [supabase])

  // Create project
  const createProject = async (
    name: string,
    options?: { description?: string; color?: string; icon?: string; suggestedByAi?: boolean }
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const newProject: NewProject = {
      user_id: user.id,
      name,
      description: options?.description,
      color: options?.color || '#6366f1',
      icon: options?.icon || '📁',
      suggested_by_ai: options?.suggestedByAi || false,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single()

    if (error) throw error

    setProjects((prev) => [data, ...prev])

    return data
  }

  // Update project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    setProjects((prev) =>
      prev.map((project) => (project.id === id ? { ...project, ...data } : project))
    )

    return data
  }

  // Archive project
  const archiveProject = async (id: string) => {
    return updateProject(id, { status: 'archived' })
  }

  // Delete project
  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error

    setProjects((prev) => prev.filter((project) => project.id !== id))
  }

  // Realtime subscription
  useEffect(() => {
    fetchProjects()

    let channel: RealtimeChannel | null = null
    let active = true

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || !active) return

      channel = supabase
        .channel(`projects_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newProject = payload.new as Project
              setProjects((prev) => {
                if (prev.some((p) => p.id === newProject.id)) {
                  return prev
                }
                return [newProject, ...prev]
              })
            } else if (payload.eventType === 'UPDATE') {
              const updatedProject = payload.new as Project
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === updatedProject.id ? updatedProject : p
                )
              )
            } else if (payload.eventType === 'DELETE') {
              const deletedProject = payload.old as { id: string }
              setProjects((prev) =>
                prev.filter((p) => p.id !== deletedProject.id)
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
  }, [supabase, fetchProjects])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    refetch: fetchProjects,
  }
}

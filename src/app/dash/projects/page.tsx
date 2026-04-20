'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import {
  FolderKanban,
  Plus,
  MoreHorizontal,
  Sparkles,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
  Edit3,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useInboxItems } from '@/hooks/useInboxItems'

const projectColors = [
  { name: 'Azure', value: '#0c87eb', bg: 'bg-azure-100', text: 'text-azure-600' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-100', text: 'text-violet-600' },
  { name: 'Green', value: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-600' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-100', text: 'text-rose-600' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-100', text: 'text-cyan-600' },
]

const projectIcons = ['📁', '💼', '🎯', '💡', '🚀', '📊', '🎨', '📝', '⚡', '🔧']

export default function ProjectsPage() {
  const { projects, loading, createProject, archiveProject, deleteProject } = useProjects()
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(projectColors[0].value)
  const [newProjectIcon, setNewProjectIcon] = useState('📁')
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    try {
      await createProject(newProjectName, {
        color: newProjectColor,
        icon: newProjectIcon,
      })
      setNewProjectName('')
      setShowNewProject(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-500">Organize your work into focused areas</p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </motion.button>
        </div>
      </motion.div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && (
          <>
            <motion.div
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProject(false)}
            />
            <motion.div
              className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Project</h3>
                
                {/* Project Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Side Project, Work, Health"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                    autoFocus
                  />
                </div>

                {/* Icon Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projectIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewProjectIcon(icon)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all ${
                          newProjectIcon === icon
                            ? 'bg-violet-100 ring-2 ring-violet-500'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {projectColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewProjectColor(color.value)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newProjectColor === color.value
                            ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="px-4 py-2 bg-violet-500 text-white font-medium rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Project
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          className="bg-white rounded-2xl border border-slate-200 shadow-soft p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-6">
            Create your first project or let AI suggest them based on your items.
          </p>
          <motion.button
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Create Project
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-soft-lg hover:border-violet-200 transition-all overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      {project.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <p className="text-sm text-slate-500">
                        {project.item_count} items • {project.completed_count} done
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.suggested_by_ai && (
                      <span className="px-2 py-1 bg-violet-100 text-violet-600 text-xs rounded-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: project.color }}
                      initial={{ width: 0 }}
                      animate={{
                        width: project.item_count
                          ? `${(project.completed_count / project.item_count) * 100}%`
                          : '0%',
                      }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    />
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-slate-600 mb-4">{project.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => archiveProject(project.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this project?')) {
                          deleteProject(project.id)
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                    View items
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

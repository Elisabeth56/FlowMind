'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import {
  Inbox,
  Sparkles,
  Filter,
  SortAsc,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  Folder,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lightbulb,
  ListTodo,
  Link as LinkIcon,
  Bell,
} from 'lucide-react'
import { useInboxItems } from '@/hooks/useInboxItems'
import { useAI } from '@/hooks/useAI'

const itemTypeIcons: Record<string, typeof Lightbulb> = {
  note: Lightbulb,
  task: ListTodo,
  idea: Sparkles,
  reminder: Bell,
  link: LinkIcon,
}

const priorityColors = {
  0: 'bg-slate-100 text-slate-600',
  1: 'bg-green-100 text-green-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
}

const priorityLabels = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export default function InboxPage() {
  const { items, loading, addItem, updateItem, completeItem, deleteItem } = useInboxItems('all')
  const { organize, loading: aiLoading } = useAI()
  const [filter, setFilter] = useState<'all' | 'inbox' | 'organized'>('all')
  const [newItemContent, setNewItemContent] = useState('')
  const [organizingIds, setOrganizingIds] = useState<Set<string>>(new Set())

  const filteredItems = items.filter(item => {
    if (filter === 'all') return item.status !== 'completed' && item.status !== 'archived'
    if (filter === 'inbox') return item.status === 'inbox'
    if (filter === 'organized') return item.status === 'organized' || item.status === 'in_progress'
    return true
  })

  const inboxCount = items.filter(i => i.status === 'inbox').length
  const organizedCount = items.filter(i => i.status === 'organized' || i.status === 'in_progress').length

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return
    
    try {
      const item = await addItem(newItemContent)
      setNewItemContent('')
      
      // Auto-organize the new item
      if (item) {
        setOrganizingIds(prev => new Set(prev).add(item.id))
        await organize({ itemIds: [item.id] })
        setOrganizingIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const handleOrganizeAll = async () => {
    const unorganizedItems = items.filter(i => i.status === 'inbox')
    if (unorganizedItems.length === 0) return

    const ids = unorganizedItems.map(i => i.id)
    setOrganizingIds(new Set(ids))
    
    try {
      await organize({ itemIds: ids })
    } finally {
      setOrganizingIds(new Set())
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-azure-500 to-azure-600 rounded-2xl flex items-center justify-center shadow-lg shadow-azure-500/20">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
              <p className="text-slate-500">Capture everything, let AI organize</p>
            </div>
          </div>
          
          {inboxCount > 0 && (
            <motion.button
              onClick={handleOrganizeAll}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 font-medium rounded-xl hover:bg-violet-200 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Organize All ({inboxCount})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Quick Add */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-4">
            <textarea
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddItem()
                }
              }}
              placeholder="What's on your mind? Dump a thought, task, idea, or link..."
              className="w-full h-20 p-0 border-0 resize-none focus:ring-0 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              ⌘+Enter to save • AI will auto-organize
            </p>
            <motion.button
              onClick={handleAddItem}
              disabled={!newItemContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-azure-500 text-white font-medium rounded-lg hover:bg-azure-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              Add
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { key: 'all', label: 'All', count: filteredItems.length },
          { key: 'inbox', label: 'Unorganized', count: inboxCount },
          { key: 'organized', label: 'Organized', count: organizedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              filter === tab.key
                ? 'bg-azure-100 text-azure-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              filter === tab.key ? 'bg-azure-200' : 'bg-slate-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-azure-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {filter === 'inbox' ? 'All caught up!' : 'No items yet'}
          </h3>
          <p className="text-slate-500">
            {filter === 'inbox' 
              ? 'Everything has been organized.' 
              : 'Start by adding your first thought above.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const TypeIcon = itemTypeIcons[item.item_type] || Lightbulb
              const isOrganizing = organizingIds.has(item.id)
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`group bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-soft-lg hover:border-azure-200 transition-all overflow-hidden ${
                    isOrganizing ? 'ring-2 ring-violet-500/20' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => completeItem(item.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        <Circle className="w-5 h-5 text-slate-300 hover:text-azure-500 transition-colors" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 leading-relaxed">{item.content}</p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* Type badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                            <TypeIcon className="w-3 h-3" />
                            {item.item_type}
                          </span>
                          
                          {/* Priority badge */}
                          {item.priority > 0 && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[item.priority as keyof typeof priorityLabels]}
                            </span>
                          )}

                          {/* Due date */}
                          {item.due_date && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs">
                              <Clock className="w-3 h-3" />
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}

                          {/* Topics */}
                          {Array.isArray(item.extracted_topics) && item.extracted_topics.slice(0, 2).map((topic, i) => (
                            typeof topic === 'string' && (
                              <span key={i} className="px-2 py-1 bg-azure-50 text-azure-700 rounded-lg text-xs">
                                {topic}
                              </span>
                            )
                          ))}

                          {/* Status indicator */}
                          {item.status === 'inbox' && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs">
                              Unorganized
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOrganizing ? (
                          <div className="p-2">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI organizing indicator */}
                  {isOrganizing && (
                    <div className="px-4 py-2 bg-violet-50 border-t border-violet-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                      <span className="text-sm text-violet-700">AI is organizing this item...</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

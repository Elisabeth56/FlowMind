'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import {
  Brain,
  Inbox,
  Calendar,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
  Plus,
  Search,
  Bell,
  User,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: 'Inbox', href: '/dash', icon: Inbox },
  { name: 'Today', href: '/dash/today', icon: Calendar },
  { name: 'Projects', href: '/dash/projects', icon: FolderKanban },
  { name: 'Insights', href: '/dash/insights', icon: BarChart3 },
]

const bottomNav = [
  { name: 'Settings', href: '/dash/settings', icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-white to-cloud">
      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/50 z-40 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <Link href="/dash" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-azure-500 to-azure-600 rounded-xl flex items-center justify-center shadow-lg shadow-azure-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <motion.span
                className="text-xl font-bold text-slate-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                flow<span className="text-azure-500">mind</span>
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 text-slate-400 transition-transform ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Quick Add Button */}
        <div className="p-4">
          <motion.button
            onClick={() => setShowQuickAdd(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-azure-500 to-azure-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-azure-500/25 transition-all ${
              collapsed ? 'px-3' : 'px-4'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            {!collapsed && <span>Quick Add</span>}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-azure-100 text-azure-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-azure-600' : ''}`} />
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 bg-azure-500 rounded-full"
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* AI Assistant Card */}
        {!collapsed && (
          <div className="mx-3 mb-4">
            <motion.div
              className="p-4 bg-gradient-to-br from-violet-50 to-azure-50 rounded-2xl border border-violet-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-slate-800">AI Assistant</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Ask me anything about your tasks and plans.
              </p>
              <Link
                href="/dash/today"
                className="text-sm font-medium text-azure-600 hover:text-azure-700"
              >
                What should I focus on? →
              </Link>
            </motion.div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          {bottomNav.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </div>
              </Link>
            )
          })}
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-slate-200/50">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your mind..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-azure-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <motion.button
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-azure-500 rounded-full" />
              </motion.button>
              
              <Link href="/dash/settings">
                <motion.div
                  className="flex items-center gap-3 pl-3 pr-4 py-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-azure-400 to-violet-500 rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile?.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddModal onClose={() => setShowQuickAdd(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('')

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-azure-100 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-azure-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Quick Add</h3>
              <p className="text-sm text-slate-500">Dump your thought, AI will organize it</p>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? A task, idea, note, reminder..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
            autoFocus
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-400">
              Press ⌘+Enter to save
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                className="px-4 py-2 bg-azure-500 text-white font-medium rounded-lg hover:bg-azure-600 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-4 h-4" />
                Add & Organize
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

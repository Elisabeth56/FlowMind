'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as motion from 'motion/react-client'
import {
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  Palette,
  ChevronRight,
} from 'lucide-react'

const settingsNav = [
  { name: 'Profile', href: '/dash/settings', icon: User },
  { name: 'Billing', href: '/dash/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/dash/settings/notifications', icon: Bell },
  { name: 'Privacy', href: '/dash/settings/privacy', icon: Shield },
  { name: 'Appearance', href: '/dash/settings/appearance', icon: Palette },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500">Manage your account and preferences</p>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-8">
        {/* Settings Nav */}
        <motion.div
          className="w-56 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <nav className="space-y-1">
            {settingsNav.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-azure-100 text-azure-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-azure-600' : ''}`} />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { Bell, Mail, Smartphone, Clock, Sparkles, Loader2, Check } from 'lucide-react'

interface ToggleProps {
  enabled: boolean
  onToggle: () => void
}

function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-azure-500' : 'bg-slate-200'
      }`}
    >
      <motion.div
        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [notifications, setNotifications] = useState({
    email_daily_plan: true,
    email_weekly_summary: true,
    email_ai_suggestions: false,
    push_reminders: true,
    push_daily_plan: true,
    push_weekly_summary: false,
    quiet_hours: true,
    quiet_start: '22:00',
    quiet_end: '08:00',
  })

  const updateNotification = (key: keyof typeof notifications, value: boolean | string) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-azure-100 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-azure-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Email Notifications</h2>
            <p className="text-sm text-slate-500">Manage what emails you receive</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Daily Plan</p>
              <p className="text-sm text-slate-500">Receive your AI-generated daily plan each morning</p>
            </div>
            <Toggle
              enabled={notifications.email_daily_plan}
              onToggle={() => updateNotification('email_daily_plan', !notifications.email_daily_plan)}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Weekly Summary</p>
              <p className="text-sm text-slate-500">Get your productivity insights every Sunday</p>
            </div>
            <Toggle
              enabled={notifications.email_weekly_summary}
              onToggle={() => updateNotification('email_weekly_summary', !notifications.email_weekly_summary)}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">AI Suggestions</p>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs font-medium rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Pro
              </span>
            </div>
            <Toggle
              enabled={notifications.email_ai_suggestions}
              onToggle={() => updateNotification('email_ai_suggestions', !notifications.email_ai_suggestions)}
            />
          </div>
        </div>
      </motion.div>

      {/* Push Notifications */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Push Notifications</h2>
            <p className="text-sm text-slate-500">Notifications on your device</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Task Reminders</p>
              <p className="text-sm text-slate-500">Get reminded about upcoming tasks</p>
            </div>
            <Toggle
              enabled={notifications.push_reminders}
              onToggle={() => updateNotification('push_reminders', !notifications.push_reminders)}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Daily Plan Ready</p>
              <p className="text-sm text-slate-500">Know when your daily plan is generated</p>
            </div>
            <Toggle
              enabled={notifications.push_daily_plan}
              onToggle={() => updateNotification('push_daily_plan', !notifications.push_daily_plan)}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Weekly Summary Ready</p>
              <p className="text-sm text-slate-500">Get notified when your weekly summary is available</p>
            </div>
            <Toggle
              enabled={notifications.push_weekly_summary}
              onToggle={() => updateNotification('push_weekly_summary', !notifications.push_weekly_summary)}
            />
          </div>
        </div>
      </motion.div>

      {/* Quiet Hours */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Quiet Hours</h2>
              <p className="text-sm text-slate-500">Pause notifications during specific hours</p>
            </div>
          </div>
          <Toggle
            enabled={notifications.quiet_hours}
            onToggle={() => updateNotification('quiet_hours', !notifications.quiet_hours)}
          />
        </div>
        
        {notifications.quiet_hours && (
          <motion.div
            className="p-4 bg-slate-50 flex items-center gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
              <input
                type="time"
                value={notifications.quiet_start}
                onChange={(e) => updateNotification('quiet_start', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
              <input
                type="time"
                value={notifications.quiet_end}
                onChange={(e) => updateNotification('quiet_end', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-azure-500 text-white font-medium rounded-xl hover:bg-azure-600 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </motion.div>
    </div>
  )
}

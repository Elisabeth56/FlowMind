'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { User, Mail, Globe, Clock, Camera, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const timezones = [
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
]

export default function ProfileSettingsPage() {
  const { user, profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    timezone: profile?.timezone || 'Africa/Lagos',
    daily_plan_time: profile?.daily_plan_time || '08:00',
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate save - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-azure-400 to-violet-500 rounded-2xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-slate-200 shadow-soft hover:bg-slate-50 transition-colors">
              <Camera className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{profile?.full_name || 'User'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Timezone
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all appearance-none"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Daily Plan Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Daily Plan Generation Time
            </label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="time"
                value={formData.daily_plan_time}
                onChange={(e) => setFormData({ ...formData, daily_plan_time: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              When AI generates your daily plan
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
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
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        className="bg-white rounded-2xl border border-red-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-600 mb-4">
          Permanently delete your account and all associated data.
        </p>
        <button className="px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </motion.div>
    </div>
  )
}

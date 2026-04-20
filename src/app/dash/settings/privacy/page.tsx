'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { 
  Shield, 
  Eye, 
  Database, 
  Download, 
  Trash2, 
  Lock,
  Loader2, 
  Check,
  AlertTriangle,
  FileText,
  Brain,
} from 'lucide-react'

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

export default function PrivacyPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const [privacy, setPrivacy] = useState({
    ai_data_training: false,
    analytics: true,
    crash_reports: true,
    usage_statistics: false,
  })

  const updatePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    setExporting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setExporting(false)
    // In production, this would trigger a download
    alert('Your data export has been prepared. Check your email for the download link.')
  }

  return (
    <div className="space-y-6">
      {/* Data & AI */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI & Data Usage</h2>
            <p className="text-sm text-slate-500">Control how your data is used</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-slate-900">AI Model Training</p>
              <p className="text-sm text-slate-500 mt-1">
                Allow your anonymized data to help improve our AI models. 
                Your personal information is never shared.
              </p>
            </div>
            <Toggle
              enabled={privacy.ai_data_training}
              onToggle={() => updatePrivacy('ai_data_training')}
            />
          </div>
          
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-slate-900">Analytics</p>
              <p className="text-sm text-slate-500 mt-1">
                Help us understand how you use FlowMind to make it better.
              </p>
            </div>
            <Toggle
              enabled={privacy.analytics}
              onToggle={() => updatePrivacy('analytics')}
            />
          </div>
          
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-slate-900">Crash Reports</p>
              <p className="text-sm text-slate-500 mt-1">
                Automatically send crash reports to help us fix issues.
              </p>
            </div>
            <Toggle
              enabled={privacy.crash_reports}
              onToggle={() => updatePrivacy('crash_reports')}
            />
          </div>
          
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-slate-900">Usage Statistics</p>
              <p className="text-sm text-slate-500 mt-1">
                Share anonymous usage patterns to help prioritize features.
              </p>
            </div>
            <Toggle
              enabled={privacy.usage_statistics}
              onToggle={() => updatePrivacy('usage_statistics')}
            />
          </div>
        </div>
      </motion.div>

      {/* Your Data */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-azure-100 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-azure-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Your Data</h2>
            <p className="text-sm text-slate-500">Download or delete your data</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Export All Data</p>
                <p className="text-sm text-slate-500">Download all your data in JSON format</p>
              </div>
            </div>
            <motion.button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Preparing...' : 'Export'}
            </motion.button>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Privacy Policy</p>
                <p className="text-sm text-slate-500">Read how we handle your data</p>
              </div>
            </div>
            <a
              href="/privacy"
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View
            </a>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Security</h2>
            <p className="text-sm text-slate-500">Your account security status</p>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Data encrypted at rest and in transit</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Secure authentication via Supabase</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">AI processing via Groq (no data retention)</span>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        className="bg-white rounded-2xl border border-red-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-4 border-b border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-slate-500">Irreversible actions</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Delete All Data</p>
              <p className="text-sm text-slate-500">Permanently delete all your items, projects, and plans</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
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

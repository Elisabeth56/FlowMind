'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import NotYetSavedNotice from '@/components/NotYetSavedNotice'
import { 
  Database, 
  Download, 
  Loader2,
  Check,
  Lock,
  AlertTriangle,
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
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  
  const [privacy, setPrivacy] = useState({
    ai_data_training: false,
    analytics: true,
    crash_reports: true,
    usage_statistics: false,
  })

  const updatePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const response = await fetch('/api/export')
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flowmind-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not export your data')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <NotYetSavedNotice what="Privacy preferences" />
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

          {exportError && (
            <div className="px-4 pb-4 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {exportError}
            </div>
          )}
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
    </div>
  )
}

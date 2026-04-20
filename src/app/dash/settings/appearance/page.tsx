'use client'

import { useState } from 'react'
import * as motion from 'motion/react-client'
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Type,
  Maximize2,
  Loader2, 
  Check,
  Sparkles,
} from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'azure' | 'violet' | 'emerald' | 'amber' | 'rose'
type FontSize = 'small' | 'medium' | 'large'
type Density = 'comfortable' | 'compact'

const accentColors: { name: AccentColor; color: string; bg: string }[] = [
  { name: 'azure', color: '#0c87eb', bg: 'bg-azure-500' },
  { name: 'violet', color: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'emerald', color: '#10b981', bg: 'bg-emerald-500' },
  { name: 'amber', color: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'rose', color: '#f43f5e', bg: 'bg-rose-500' },
]

export default function AppearancePage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [appearance, setAppearance] = useState({
    theme: 'light' as Theme,
    accentColor: 'azure' as AccentColor,
    fontSize: 'medium' as FontSize,
    density: 'comfortable' as Density,
    reduceMotion: false,
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Theme</h2>
            <p className="text-sm text-slate-500">Choose your preferred color scheme</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setAppearance(prev => ({ ...prev, theme: option.value as Theme }))}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  appearance.theme === option.value
                    ? 'border-azure-500 bg-azure-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <option.icon className={`w-6 h-6 mx-auto mb-2 ${
                  appearance.theme === option.value ? 'text-azure-600' : 'text-slate-500'
                }`} />
                <p className={`text-sm font-medium ${
                  appearance.theme === option.value ? 'text-azure-700' : 'text-slate-700'
                }`}>
                  {option.label}
                </p>
                {appearance.theme === option.value && (
                  <motion.div
                    className="absolute top-2 right-2 w-5 h-5 bg-azure-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Accent Color */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-azure-400 to-violet-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Accent Color</h2>
              <p className="text-sm text-slate-500">Personalize the app with your favorite color</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-violet-100 text-violet-600 text-xs font-medium rounded-full">
            Pro
          </span>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-3">
            {accentColors.map((color) => (
              <motion.button
                key={color.name}
                onClick={() => setAppearance(prev => ({ ...prev, accentColor: color.name }))}
                className={`w-10 h-10 rounded-full transition-all ${color.bg} ${
                  appearance.accentColor === color.name
                    ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                    : 'hover:scale-105'
                }`}
                whileHover={{ scale: appearance.accentColor === color.name ? 1.1 : 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {appearance.accentColor === color.name && (
                  <Check className="w-5 h-5 text-white mx-auto" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Font Size */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Type className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Font Size</h2>
            <p className="text-sm text-slate-500">Adjust text size for better readability</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2">
            {[
              { value: 'small', label: 'Small', size: 'text-sm' },
              { value: 'medium', label: 'Medium', size: 'text-base' },
              { value: 'large', label: 'Large', size: 'text-lg' },
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setAppearance(prev => ({ ...prev, fontSize: option.value as FontSize }))}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  appearance.fontSize === option.value
                    ? 'border-azure-500 bg-azure-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`font-medium ${option.size} ${
                  appearance.fontSize === option.value ? 'text-azure-700' : 'text-slate-700'
                }`}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Density */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Display Density</h2>
            <p className="text-sm text-slate-500">Control spacing and padding</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'comfortable', label: 'Comfortable', desc: 'More spacing, easier to read' },
              { value: 'compact', label: 'Compact', desc: 'Less spacing, more content' },
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setAppearance(prev => ({ ...prev, density: option.value as Density }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  appearance.density === option.value
                    ? 'border-azure-500 bg-azure-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p className={`font-medium ${
                  appearance.density === option.value ? 'text-azure-700' : 'text-slate-700'
                }`}>
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reduce Motion */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Reduce Motion</h2>
              <p className="text-sm text-slate-500">Minimize animations throughout the app</p>
            </div>
          </div>
          <button
            onClick={() => setAppearance(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              appearance.reduceMotion ? 'bg-azure-500' : 'bg-slate-200'
            }`}
          >
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: appearance.reduceMotion ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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

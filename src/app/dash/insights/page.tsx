'use client'

import { useState, useEffect } from 'react'
import * as motion from 'motion/react-client'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  AlertTriangle,
  Lightbulb,
  Calendar,
} from 'lucide-react'
import { useAI } from '@/hooks/useAI'

const trendIcons = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

const trendColors = {
  improving: 'text-green-600 bg-green-100',
  stable: 'text-slate-600 bg-slate-100',
  declining: 'text-red-600 bg-red-100',
}

export default function InsightsPage() {
  const { getWeeklySummary, getPastSummaries, loading } = useAI()
  const [summary, setSummary] = useState<any>(null)
  const [pastSummaries, setPastSummaries] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    fetchSummary()
    fetchPastSummaries()
  }, [weekOffset])

  const fetchSummary = async () => {
    setGenerating(true)
    try {
      const result = await getWeeklySummary(weekOffset)
      if (result) {
        setSummary(result)
      }
    } finally {
      setGenerating(false)
    }
  }

  const fetchPastSummaries = async () => {
    const results = await getPastSummaries(4)
    setPastSummaries(results)
  }

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'This Week'
    if (weekOffset === -1) return 'Last Week'
    return `${Math.abs(weekOffset)} weeks ago`
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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
              <p className="text-slate-500">AI-powered weekly retrospectives</p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 min-w-[100px] text-center">
              {getWeekLabel()}
            </span>
            <button
              onClick={() => setWeekOffset(Math.min(0, weekOffset + 1))}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </motion.div>

      {loading || generating ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-600">Analyzing your week...</p>
          </div>
        </div>
      ) : !summary ? (
        <motion.div
          className="bg-white rounded-2xl border border-slate-200 shadow-soft p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No summary yet</h3>
          <p className="text-slate-500 mb-6">
            Complete some tasks to generate your weekly insights.
          </p>
          <motion.button
            onClick={fetchSummary}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            Generate Summary
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: 'Created', value: summary.items_created, icon: Calendar, color: 'azure' },
              { label: 'Completed', value: summary.items_completed, icon: CheckCircle2, color: 'emerald' },
              { label: 'Carried Over', value: summary.items_carried_over, icon: Clock, color: 'amber' },
              { label: 'Focus Score', value: `${summary.focus_score || 0}%`, icon: Target, color: 'violet' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === 'azure' ? 'bg-azure-100 text-azure-600' :
                  stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                  'bg-violet-100 text-violet-600'
                }`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trend Badge */}
          {summary.productivity_trend && (
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${trendColors[summary.productivity_trend as keyof typeof trendColors]}`}>
                {(() => {
                  const TrendIcon = trendIcons[summary.productivity_trend as keyof typeof trendIcons]
                  return <TrendIcon className="w-4 h-4" />
                })()}
                <span className="font-medium capitalize">{summary.productivity_trend}</span>
                <span className="text-sm opacity-75">vs last week</span>
              </div>
            </motion.div>
          )}

          {/* AI Summary */}
          <motion.div
            className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">AI Summary</span>
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {summary.summary_text}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Accomplishments */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-slate-900">Accomplishments</span>
              </div>
              <div className="p-4 space-y-3">
                {Array.isArray(summary.accomplishments) && summary.accomplishments.length > 0 ? (
                  summary.accomplishments.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No accomplishments recorded</p>
                )}
              </div>
            </motion.div>

            {/* Suggestions */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-slate-900">Suggestions</span>
              </div>
              <div className="p-4 space-y-3">
                {Array.isArray(summary.suggestions) && summary.suggestions.length > 0 ? (
                  summary.suggestions.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-100 text-red-600' :
                        item.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-sm text-slate-700">{item.suggestion}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No suggestions yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Patterns */}
          {Array.isArray(summary.patterns) && summary.patterns.length > 0 && (
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-azure-500" />
                <span className="font-semibold text-slate-900">Patterns Detected</span>
              </div>
              <div className="p-4 space-y-3">
                {summary.patterns.map((pattern: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl ${
                      pattern.type === 'positive' ? 'bg-green-50 border border-green-100' :
                      pattern.type === 'negative' ? 'bg-red-50 border border-red-100' :
                      'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      pattern.type === 'positive' ? 'text-green-700' :
                      pattern.type === 'negative' ? 'text-red-700' :
                      'text-slate-700'
                    }`}>
                      {pattern.pattern}
                    </p>
                    {pattern.evidence && (
                      <p className="text-xs text-slate-500 mt-1">{pattern.evidence}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Weeks */}
          {pastSummaries.length > 1 && (
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="p-4 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Past Weeks</span>
              </div>
              <div className="divide-y divide-slate-100">
                {pastSummaries.slice(1).map((past, i) => (
                  <button
                    key={past.id}
                    onClick={() => setWeekOffset(-(i + 1))}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium text-slate-900">
                        {new Date(past.week_start).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })} - {new Date(past.week_end).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {past.items_completed} completed • Score: {past.focus_score}%
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

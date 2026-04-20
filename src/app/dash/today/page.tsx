'use client'

import { useState, useEffect } from 'react'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import {
  Calendar,
  Sparkles,
  Sun,
  Coffee,
  Moon,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  RefreshCw,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { useAI } from '@/hooks/useAI'

export default function TodayPage() {
  const { getDailyPlan, askAboutDay, loading } = useAI()
  const [plan, setPlan] = useState<any>(null)
  const [aiPlan, setAiPlan] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [askingAI, setAskingAI] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async (regenerate = false) => {
    setGenerating(true)
    try {
      const result = await getDailyPlan({ regenerate })
      if (result) {
        setPlan(result)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim()) return
    setAskingAI(true)
    try {
      const result = await askAboutDay(question)
      if (result) {
        setAnswer(result)
      }
    } finally {
      setAskingAI(false)
    }
  }

  const today = new Date()
  const timeOfDay = today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'
  const TimeIcon = timeOfDay === 'morning' ? Sun : timeOfDay === 'afternoon' ? Coffee : Moon

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
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Good {timeOfDay}!
              </h1>
              <p className="text-slate-500">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => fetchPlan(true)}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate Plan
          </motion.button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Plan Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Reasoning Card */}
          {plan?.reasoning && (
            <motion.div
              className="bg-gradient-to-br from-violet-50 to-azure-50 rounded-2xl border border-violet-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-slate-800">AI Recommendation</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{plan.reasoning}</p>
              {plan.energy_recommendation && (
                <div className="mt-4 flex items-start gap-2 pt-4 border-t border-violet-200/50">
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                  <p className="text-sm text-slate-600">{plan.energy_recommendation}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Plan Items */}
          {loading || generating ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-azure-500 mx-auto mb-4" />
                <p className="text-slate-600">Generating your daily plan...</p>
              </div>
            </div>
          ) : !plan ? (
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-azure-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-azure-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No plan yet for today
              </h3>
              <p className="text-slate-500 mb-6">
                Add some items to your inbox and generate a daily plan.
              </p>
              <motion.button
                onClick={() => fetchPlan(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-azure-500 text-white font-medium rounded-xl hover:bg-azure-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                Generate Plan
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-azure-500" />
                  <span className="font-semibold text-slate-900">Today's Focus</span>
                </div>
                <span className="text-sm text-slate-500">
                  {plan.items_completed || 0} / {plan.items_total || 0} completed
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {Array.isArray(plan.plan_items) && plan.plan_items.length > 0 ? (
                  plan.plan_items.map((planItem: any, index: number) => (
                    <motion.div
                      key={planItem.item_id || index}
                      className="p-4 hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="flex items-start gap-3">
                        <button className="mt-1 flex-shrink-0">
                          <Circle className="w-5 h-5 text-slate-300 hover:text-azure-500 transition-colors" />
                        </button>
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">
                            {planItem.item?.content || `Task ${index + 1}`}
                          </p>
                          {planItem.notes && (
                            <p className="text-sm text-slate-500 mt-1">{planItem.notes}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {planItem.scheduled_time && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {planItem.scheduled_time}
                              </span>
                            )}
                            {planItem.duration_minutes && (
                              <span className="text-xs text-slate-400">
                                ~{planItem.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No tasks scheduled for today
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ask AI Card */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-slate-900">Ask AI</span>
              </div>
            </div>
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAsk()
                  }}
                  placeholder="What should I focus on?"
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
                <button
                  onClick={handleAsk}
                  disabled={askingAI || !question.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-violet-500 hover:text-violet-600 disabled:text-slate-300"
                >
                  {askingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {answer && (
                <motion.div
                  className="mt-4 p-4 bg-violet-50 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
                </motion.div>
              )}

              {/* Quick questions */}
              <div className="mt-4 space-y-2">
                {[
                  'What should I prioritize?',
                  'Do I have time for a break?',
                  'What can I delegate?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(q)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-slate-900">Today's Progress</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Tasks completed</span>
                  <span className="font-medium text-slate-900">
                    {plan?.items_completed || 0}/{plan?.items_total || 0}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-azure-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: plan?.items_total
                        ? `${((plan.items_completed || 0) / plan.items_total) * 100}%`
                        : '0%',
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

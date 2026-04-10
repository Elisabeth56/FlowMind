"use client";

import * as motion from "motion/react-client";
import { ArrowUpRight, TrendingUp, CheckCircle, Clock, Target } from "lucide-react";

export default function WeeklySummary() {
  return (
    <section className="py-24 bg-gradient-to-b from-azure-50/30 to-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-medium text-slate-900 mb-6 leading-tight">
            Weekly summaries that
            <br />
            <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
              keep you accountable
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every week, get an AI-generated report of what you accomplished vs. what you
            planned. Understand your patterns. Improve your flow.
          </p>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-azure-500 to-violet-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80 mb-1">Weekly Summary</div>
                  <div className="text-2xl font-semibold">March 24 - 30, 2026</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 border-b border-slate-100">
              {[
                { icon: CheckCircle, value: "23", label: "Tasks completed", color: "text-emerald-500" },
                { icon: Target, value: "87%", label: "Goals achieved", color: "text-azure-500" },
                { icon: Clock, value: "34h", label: "Focused time", color: "text-violet-500" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`p-6 text-center ${i < 2 ? "border-r border-slate-100" : ""}`}
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Accomplished */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  🎯 What You Accomplished
                </h4>
                <div className="space-y-2">
                  {[
                    "Completed Q2 financial report ahead of deadline",
                    "Launched new marketing campaign — 3 days early",
                    "Closed 2 client deals worth $45K combined",
                    "Cleared entire email backlog (127 emails processed)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  💡 AI Insights
                </h4>
                <div className="bg-azure-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                  <p className="mb-2">
                    <strong>Great week!</strong> Your productivity peaked on Tuesday and Wednesday
                    mornings. You completed 40% more tasks when you started with high-priority
                    items before checking email.
                  </p>
                  <p>
                    <strong>Suggestion:</strong> Block 9-11 AM for deep work — you&apos;re 2.5x more
                    productive during this window.
                  </p>
                </div>
              </div>

              {/* Carried Over */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  📋 Carried to Next Week
                </h4>
                <div className="space-y-2">
                  {[
                    "Review partnership proposal from Acme Corp",
                    "Schedule quarterly team reviews",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-500">
                      <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Ready to see your own insights?
                </span>
                <motion.a
                  href="#start"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-azure-500 text-white text-sm font-medium rounded-full hover:bg-azure-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get started
                  <ArrowUpRight className="w-4 h-4" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="inline-block bg-gradient-to-r from-azure-500 to-violet-500 p-px rounded-3xl">
            <div className="bg-white rounded-3xl px-12 py-10">
              <h3 className="text-3xl font-semibold text-slate-900 mb-4">
                Ready to think clearly?
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Join thousands of busy professionals using FlowMind to bring order to chaos.
              </p>
              <motion.a
                href="#start"
                className="inline-flex items-center gap-3 px-8 py-4 bg-azure-500 text-white font-medium rounded-full hover:bg-azure-600 transition-all duration-300 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start your free trial
                <span className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </motion.a>
              <p className="text-sm text-slate-500 mt-4">
                No credit card required · 14-day free trial
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

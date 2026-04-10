"use client";

import * as motion from "motion/react-client";
import { ArrowRight, Download, Wand2, Target } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Dump everything",
    description:
      "Capture thoughts, tasks, notes, and ideas as they come. No structure needed — just get it out of your head.",
    preview: (
      <div className="space-y-2">
        <div className="bg-azure-50 rounded-lg p-3 text-sm text-slate-700">
          💡 Idea for Q3 campaign...
        </div>
        <div className="bg-violet-50 rounded-lg p-3 text-sm text-slate-700">
          📝 Call mom about Sunday
        </div>
        <div className="bg-sky-50 rounded-lg p-3 text-sm text-slate-700">
          🔗 Read that article on AI trends
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 text-sm text-slate-700">
          ✅ Review Sarah&apos;s proposal
        </div>
      </div>
    ),
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI organizes",
    description:
      "FlowMind's AI automatically categorizes, prioritizes, and structures your thoughts into actionable projects.",
    preview: (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-azure-500" />
            <span className="text-sm font-medium text-slate-800">Work</span>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <div>• Q3 campaign idea → Marketing</div>
            <div>• Review proposal → High Priority</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-sm font-medium text-slate-800">Personal</span>
          </div>
          <div className="text-xs text-slate-500">• Call mom → Scheduled Sunday</div>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    icon: Target,
    title: "Focus & execute",
    description:
      'Ask "What should I focus on?" and get a daily plan. Track progress with weekly AI summaries.',
    preview: (
      <div className="bg-gradient-to-br from-azure-500 to-violet-500 rounded-lg p-4 text-white">
        <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
          Today&apos;s Focus
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              1
            </div>
            <span className="text-sm">Review Sarah&apos;s proposal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              2
            </div>
            <span className="text-sm">Draft Q3 campaign brief</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              3
            </div>
            <span className="text-sm">Read AI trends article</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/20 text-xs opacity-80">
          ✨ AI suggests: Start with the proposal while your energy is high
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
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
            How it{" "}
            <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
              works
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Three simple steps to transform mental chaos into crystal clarity
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`grid md:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold text-azure-100">{step.number}</span>
                  <div className="w-12 h-12 rounded-xl bg-azure-500 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center gap-2 text-azure-500">
                    <ArrowRight className="w-5 h-5" />
                    <span className="text-sm font-medium">Next step</span>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className={index % 2 === 1 ? "md:order-1" : ""}>
                <motion.div
                  className="bg-white rounded-2xl p-6 shadow-soft-lg border border-slate-100"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.preview}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

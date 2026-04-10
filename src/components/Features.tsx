"use client";

import * as motion from "motion/react-client";
import { Inbox, Sparkles, Calendar, BarChart3, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "Dump everything in one place — notes, tasks, ideas, links. No more scattered thoughts across 10 different apps.",
    color: "azure",
  },
  {
    icon: Sparkles,
    title: "AI Auto-Organization",
    description:
      "Our AI (powered by Groq + Mistral) automatically sorts your chaos into projects, priorities, and actionable items.",
    color: "violet",
  },
  {
    icon: Calendar,
    title: "Smart Daily Plans",
    description:
      'Ask "What should I focus on today?" and get a reasoned daily plan based on your priorities and deadlines.',
    color: "sky",
  },
  {
    icon: BarChart3,
    title: "Weekly Summaries",
    description:
      "Every week, get an AI-generated summary of what you accomplished vs. what you planned. Track your momentum.",
    color: "indigo",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white/50 to-azure-50/30">
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
            Everything you need to
            <br />
            <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
              think clearly
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Stop juggling multiple apps. FlowMind is your complete productivity operating system,
            powered by cutting-edge AI.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-soft border border-slate-100 hover:shadow-soft-lg hover:border-azure-200 transition-all duration-300 h-full">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    feature.color === "azure"
                      ? "bg-azure-100 text-azure-600"
                      : feature.color === "violet"
                      ? "bg-violet-100 text-violet-600"
                      : feature.color === "sky"
                      ? "bg-sky-100 text-sky-600"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Learn more link */}
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-sm font-medium text-azure-600 hover:text-azure-700 transition-colors group/link"
                >
                  Learn more
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>

                {/* Decorative gradient */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-2xl ${
                    feature.color === "azure"
                      ? "bg-azure-200"
                      : feature.color === "violet"
                      ? "bg-violet-200"
                      : feature.color === "sky"
                      ? "bg-sky-200"
                      : "bg-indigo-200"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

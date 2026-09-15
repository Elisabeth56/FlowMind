"use client";

import * as motion from "motion/react-client";
import { revealViewport } from "@/lib/motion";
import { Brain, Gauge, Lock, ShieldCheck } from "lucide-react";

// Replaces the old "Featured in" strip, which claimed press coverage and
// usage numbers FlowMind doesn't have. Everything below is verifiable from
// the app itself.
const stack = [
  "Groq",
  "LangChain",
  "Supabase",
  "Next.js",
  "Paystack",
];

const promises = [
  {
    icon: Gauge,
    title: "Answers in seconds",
    description:
      "Groq's inference runs your inbox through the model fast enough to feel instant.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    description:
      "Notes live in your own row-level-secured Supabase tables. No training on your content.",
  },
  {
    icon: ShieldCheck,
    title: "Free to start",
    description:
      "Fifty AI calls a month, no card required. Upgrade only once it earns its keep.",
  },
];

export default function BuiltWith() {
  return (
    <section className="py-16 bg-white/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          className="text-center text-sm text-slate-500 mb-8 tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={revealViewport}
          transition={{ duration: 0.4 }}
        >
          Built on
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {stack.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors cursor-default"
            >
              <Brain className="w-4 h-4 text-azure-400" />
              <span className="text-sm font-medium tracking-wide">{name}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {promises.map((promise) => (
            <div
              key={promise.title}
              className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-azure-100 flex items-center justify-center mb-4">
                <promise.icon className="w-5 h-5 text-azure-600" />
              </div>
              <h3 className="font-medium text-slate-900 mb-2">{promise.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {promise.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import * as motion from "motion/react-client";
import { ArrowUpRight, Sparkles, Inbox, Brain, ListTodo } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, #f0f7ff 0%, #e0efff 50%, #f0f7ff 100%)
            `,
          }}
        />

        {/* Floating elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-azure-200/30 rounded-full blur-3xl"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 30, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-20">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-azure-200 mb-8 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-4 h-4 text-azure-500" />
          <span className="text-sm font-medium text-slate-700">Powered by Groq + Mistral AI</span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl font-medium text-slate-900 mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Your AI-powered
          <br />
          <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
            second brain
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Dump your notes, tasks, and ideas into one inbox. Let AI organize them
          into projects, priorities, and daily action plans. Finally, clarity from chaos.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <motion.a
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 bg-azure-500 text-white text-lg font-medium rounded-full hover:bg-azure-600 transition-all duration-300 shadow-lg group"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Start for free
            <span className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </motion.a>
          <motion.a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 text-slate-700 text-lg font-medium rounded-full border border-slate-200 hover:bg-white hover:border-azure-300 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Watch demo
          </motion.a>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {[
            { icon: Inbox, text: "Unified inbox" },
            { icon: Brain, text: "AI organization" },
            { icon: ListTodo, text: "Daily plans" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-slate-600"
            >
              <item.icon className="w-4 h-4 text-azure-500" />
              {item.text}
            </div>
          ))}
        </motion.div>

        {/* App preview mockup */}
        <motion.div
          className="mt-16 relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Browser window frame */}
            <div className="bg-white rounded-2xl shadow-soft-lg border border-slate-200 overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200">
                    app.flowmind.ai
                  </div>
                </div>
              </div>
              
              {/* App content preview */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-azure-50/30">
                <div className="grid grid-cols-3 gap-4">
                  {/* Sidebar */}
                  <div className="col-span-1 bg-white rounded-xl p-4 shadow-soft">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-azure-500" />
                      <span className="font-medium text-slate-800">FlowMind</span>
                    </div>
                    <div className="space-y-2">
                      {["Inbox", "Today", "Projects", "Archive"].map((item, i) => (
                        <div
                          key={i}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            i === 1 ? "bg-azure-100 text-azure-700" : "text-slate-600"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="col-span-2 space-y-3">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        <span className="font-medium text-slate-800">AI Suggestion</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Based on your priorities, focus on &quot;Q2 Report&quot; this morning.
                        You have 3 hours before your next meeting.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-slate-800 mb-2">Today&apos;s Focus</div>
                      <div className="space-y-2">
                        {["Complete Q2 report draft", "Review team feedback", "Prepare presentation"].map((task, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-4 h-4 rounded border-2 border-azure-300" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-azure-500/20 via-violet-500/20 to-azure-500/20 rounded-3xl blur-2xl -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

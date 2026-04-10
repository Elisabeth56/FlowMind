"use client";

import * as motion from "motion/react-client";
import { ArrowUpRight, MessageSquare, Sparkles, Clock, CheckCircle2 } from "lucide-react";

export default function DailyPlan() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-azure-50/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-azure-100 rounded-full text-azure-700 text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4" />
              Ask your AI
            </div>

            <h2 className="text-4xl md:text-5xl font-medium text-slate-900 mb-6 leading-tight">
              &quot;What should I
              <br />
              <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
                focus on today?
              </span>&quot;
            </h2>

            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              No more decision fatigue. FlowMind analyzes your priorities, deadlines,
              and energy patterns to create a reasoned daily plan. Just ask, and it
              delivers clarity in seconds.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Considers your deadlines and priorities",
                "Learns your productivity patterns",
                "Adapts to your available time",
                "Explains the reasoning behind suggestions",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3 text-slate-700"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-azure-500 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>

            <motion.a
              href="#try"
              className="inline-flex items-center gap-3 px-6 py-3 bg-azure-500 text-white font-medium rounded-full hover:bg-azure-600 transition-all duration-300 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try it free
              <span className="flex items-center justify-center w-7 h-7 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </motion.a>
          </motion.div>

          {/* Chat Mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-200 overflow-hidden">
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-azure-400 to-violet-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">FlowMind AI</div>
                  <div className="text-xs text-slate-500">Always ready to help</div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-6 space-y-4 bg-slate-50/50">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-azure-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                    What should I focus on today?
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-4 max-w-[90%] shadow-soft">
                    <p className="text-slate-700 text-sm leading-relaxed mb-4">
                      Based on your priorities and deadlines, here&apos;s your focus plan
                      for today:
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          time: "9:00 AM",
                          task: "Review Q2 report",
                          reason: "Due tomorrow, needs 2h focused work",
                          priority: "high",
                        },
                        {
                          time: "11:30 AM",
                          task: "Team standup",
                          reason: "Recurring meeting",
                          priority: "medium",
                        },
                        {
                          time: "2:00 PM",
                          task: "Draft client proposal",
                          reason: "High impact, you're sharpest post-lunch",
                          priority: "high",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-slate-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">
                              {item.task}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.reason}
                            </div>
                          </div>
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              item.priority === "high" ? "bg-azure-500" : "bg-slate-300"
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      💡 I&apos;ve left your afternoons lighter — you mentioned feeling
                      drained after 4 PM last week.
                    </div>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:border-azure-300"
                  />
                  <button className="w-10 h-10 rounded-full bg-azure-500 flex items-center justify-center hover:bg-azure-600 transition-colors">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 bg-azure-200/50 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-32 h-32 bg-violet-200/50 rounded-full blur-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

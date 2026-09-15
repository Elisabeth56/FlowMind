'use client'

import * as motion from 'motion/react-client'
import { revealViewport } from '@/lib/motion'
import { FREE_TIER_AI_CALLS } from '@/lib/plans'

const faqs = [
  {
    question: 'What counts as an AI call?',
    answer: `Every time FlowMind runs the model for you: organising an inbox item, generating a daily plan, answering a question about your day, or writing a weekly summary. The free plan includes ${FREE_TIER_AI_CALLS} of them per month, and the counter resets at the start of each month.`,
  },
  {
    question: 'What happens when I hit the free limit?',
    answer:
      'Nothing you have captured goes away. The inbox, your projects and every past plan stay fully readable and editable — only new AI runs pause until the month rolls over or you upgrade.',
  },
  {
    question: 'How do I pay?',
    answer:
      'Through Paystack, with a card, bank transfer or USSD. FlowMind never sees or stores your card details.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'Any time, from Settings → Billing. Your subscription stops renewing and you keep Pro until the end of the period you already paid for.',
  },
  {
    question: 'Is my data used to train models?',
    answer:
      'No. Your notes live in your own row-level-secured Supabase tables and are only sent to the model to answer your own requests.',
  },
]

export default function PricingFaq() {
  return (
    <section className="py-24 bg-gradient-to-b from-white/50 to-azure-50/30">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          className="text-3xl md:text-4xl font-medium text-slate-900 text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.5 }}
        >
          Questions, answered
        </motion.h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={faq.question}
              className="group bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 font-medium text-slate-900">
                {faq.question}
                <span className="text-azure-500 text-xl leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-slate-600 leading-relaxed">{faq.answer}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}

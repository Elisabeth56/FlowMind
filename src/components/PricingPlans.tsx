'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as motion from 'motion/react-client'
import { ArrowUpRight, Check, CreditCard, Shield, Sparkles } from 'lucide-react'
import {
  FREE_FEATURES,
  PRO_FEATURES,
  PRO_YEARLY_SAVINGS,
  PRO_YEARLY_TOTAL,
  YEARLY_DISCOUNT_PERCENT,
  formatNaira,
  proMonthlyPrice,
  type BillingPeriod,
} from '@/lib/plans'

export default function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <>
      {/* Billing Toggle */}
      <motion.div
        className="flex justify-center mb-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-soft inline-flex">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              period === 'monthly'
                ? 'bg-azure-500 text-white shadow-lg shadow-azure-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
              period === 'yearly'
                ? 'bg-azure-500 text-white shadow-lg shadow-azure-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                period === 'yearly'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              -{YEARLY_DISCOUNT_PERCENT}%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Plans */}
      <motion.div
        className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Free */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">{formatNaira(0)}</span>
              <span className="text-slate-500">/forever</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Everything you need to try the whole loop.
            </p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-slate-500" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="w-full py-3 text-center border border-slate-200 text-slate-700 font-medium rounded-full hover:bg-slate-50 transition-colors"
          >
            Start for free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative bg-gradient-to-br from-azure-500 via-azure-600 to-violet-600 rounded-3xl p-8 text-white overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-violet-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Pro</h2>
                <Sparkles className="w-4 h-4 text-white/80" />
                {period === 'yearly' && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    Save {PRO_YEARLY_SAVINGS}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{proMonthlyPrice(period)}</span>
                <span className="text-white/70">/month</span>
              </div>
              <p className="text-sm text-white/70 mt-2">
                {period === 'yearly'
                  ? `Billed yearly at ${PRO_YEARLY_TOTAL}.`
                  : 'Billed monthly. Cancel any time.'}
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Checkout lives behind auth, so send people through signup; the
                billing screen picks the same monthly/yearly choice back up. */}
            <Link
              href="/signup?plan=pro"
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-azure-600 font-semibold rounded-full hover:bg-white/90 transition-colors shadow-lg group"
            >
              Get Pro
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex flex-wrap items-center justify-center gap-8 mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CreditCard className="w-4 h-4" />
          <span>Cards, bank transfer, USSD</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secured by Paystack</span>
        </div>
      </motion.div>
    </>
  )
}

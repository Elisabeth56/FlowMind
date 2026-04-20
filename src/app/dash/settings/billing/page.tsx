'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as motion from 'motion/react-client'
import { useSubscription } from '@/hooks/useSubscription'
import { 
  Check, 
  Loader2, 
  Sparkles, 
  Zap, 
  Shield, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Crown,
  Infinity,
} from 'lucide-react'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  
  const {
    subscription,
    tier,
    status,
    limits,
    loading,
    checkout,
    cancel,
    reactivate,
    isPro,
    isActive,
  } = useSubscription()

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [actionLoading, setActionLoading] = useState(false)

  const handleCheckout = async () => {
    setActionLoading(true)
    await checkout(billingPeriod === 'yearly' ? 'pro_yearly' : 'pro_monthly')
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) {
      return
    }
    setActionLoading(true)
    try {
      await cancel()
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    setActionLoading(true)
    try {
      await reactivate()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-azure-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <motion.div
          className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700">
            Payment successful! Welcome to FlowMind Pro 🎉
          </span>
        </motion.div>
      )}

      {error && (
        <motion.div
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">
            {error === 'payment_failed' && 'Payment failed. Please try again.'}
            {error === 'verification_failed' && 'Could not verify payment. Contact support if charged.'}
            {error === 'missing_reference' && 'Invalid payment reference.'}
          </span>
        </motion.div>
      )}

      {/* Current Plan Card */}
      <motion.div
        className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                  isPro 
                    ? 'bg-gradient-to-r from-azure-100 to-violet-100 text-azure-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isPro && <Crown className="w-3 h-3" />}
                  {tier.toUpperCase()}
                </span>
                {status === 'non_renewing' && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                    Cancelling
                  </span>
                )}
              </div>
              {isPro && subscription && (
                <p className="text-sm text-slate-500">
                  Next billing: {new Date(subscription.next_payment_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
            
            {isPro && isActive && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Cancel subscription
              </button>
            )}

            {isPro && status === 'non_renewing' && (
              <motion.button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="text-sm text-azure-600 hover:text-azure-700 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Reactivate
              </motion.button>
            )}
          </div>

          {/* Usage Stats */}
          {limits && (
            <div className="bg-gradient-to-br from-slate-50 to-azure-50/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">AI Calls This Month</span>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  {limits.ai_calls_used}
                  <span className="text-slate-400">/</span>
                  {limits.ai_calls_per_month === 'unlimited' ? (
                    <Infinity className="w-4 h-4 text-azure-500" />
                  ) : (
                    limits.ai_calls_per_month
                  )}
                </span>
              </div>
              {limits.ai_calls_per_month !== 'unlimited' && (
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-azure-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(100, (limits.ai_calls_used / (limits.ai_calls_per_month as number)) * 100)}%` 
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              )}
              {isPro && (
                <p className="text-xs text-azure-600 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Unlimited AI calls with Pro
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Upgrade Section (show only for free users) */}
      {!isPro && (
        <>
          {/* Billing Toggle */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-soft inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-azure-500 text-white shadow-lg shadow-azure-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-azure-500 text-white shadow-lg shadow-azure-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  billingPeriod === 'yearly'
                    ? 'bg-white/20 text-white'
                    : 'bg-green-100 text-green-700'
                }`}>
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Plans Comparison */}
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">₦0</span>
                  <span className="text-slate-500">/forever</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  '50 AI calls per month',
                  'Basic inbox organization',
                  'Daily planning',
                  'Weekly summaries',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-500" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                disabled
                className="w-full py-3 border border-slate-200 text-slate-400 font-medium rounded-xl cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-gradient-to-br from-azure-500 via-azure-600 to-violet-600 rounded-2xl p-6 text-white overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Pro</h3>
                  <Sparkles className="w-4 h-4 text-white/80" />
                  {billingPeriod === 'yearly' && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Save ₦12,000
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">
                    {billingPeriod === 'yearly' ? '₦4,000' : '₦5,000'}
                  </span>
                  <span className="text-white/70">
                    /month{billingPeriod === 'yearly' ? ' (billed yearly)' : ''}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-white/70 mb-6">₦48,000/year</p>
                )}
                {billingPeriod === 'monthly' && <div className="mb-6" />}
                
                <ul className="space-y-3 mb-6">
                  {[
                    'Unlimited AI calls',
                    'Advanced organization',
                    'Priority support',
                    'Custom projects',
                    'API access',
                    'Export data',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <motion.button
                  onClick={handleCheckout}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-azure-600 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Upgrade to Pro
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Payment Methods & Security */}
      <motion.div
        className="flex items-center justify-center gap-8 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CreditCard className="w-4 h-4" />
          <span>Cards, Bank Transfer, USSD</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secured by Paystack</span>
        </div>
      </motion.div>
    </div>
  )
}

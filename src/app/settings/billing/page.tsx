'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

  const plans = {
    free: {
      name: 'Free',
      price: '₦0',
      period: 'forever',
      features: [
        '50 AI calls per month',
        'Basic inbox organization',
        'Daily planning',
        'Weekly summaries',
      ],
    },
    pro: {
      name: 'Pro',
      price: billingPeriod === 'yearly' ? '₦4,000' : '₦5,000',
      period: billingPeriod === 'yearly' ? '/month (billed yearly)' : '/month',
      yearlyTotal: '₦48,000/year',
      savings: billingPeriod === 'yearly' ? 'Save ₦12,000' : null,
      features: [
        'Unlimited AI calls',
        'Advanced organization',
        'Priority support',
        'Custom projects',
        'API access',
        'Export data',
      ],
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Billing & Subscription
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Manage your FlowMind subscription
      </p>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700 dark:text-green-400">
            Payment successful! Welcome to FlowMind Pro 🎉
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 dark:text-red-400">
            {error === 'payment_failed' && 'Payment failed. Please try again.'}
            {error === 'verification_failed' && 'Could not verify payment. Contact support if charged.'}
            {error === 'missing_reference' && 'Invalid payment reference.'}
          </span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Current Plan
              </h2>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isPro 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {tier.toUpperCase()}
              </span>
              {status === 'non_renewing' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  Cancelling
                </span>
              )}
            </div>
            {isPro && subscription && (
              <p className="text-sm text-slate-500 mt-1">
                Next billing: {new Date(subscription.next_payment_date).toLocaleDateString()}
              </p>
            )}
          </div>
          
          {isPro && isActive && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cancel subscription
            </button>
          )}

          {isPro && status === 'non_renewing' && (
            <button
              onClick={handleReactivate}
              disabled={actionLoading}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Reactivate
            </button>
          )}
        </div>

        {/* Usage Stats */}
        {limits && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">AI Calls This Month</span>
              <span className="text-sm font-medium">
                {limits.ai_calls_used} / {limits.ai_calls_per_month === 'unlimited' ? '∞' : limits.ai_calls_per_month}
              </span>
            </div>
            {limits.ai_calls_per_month !== 'unlimited' && (
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (limits.ai_calls_used / (limits.ai_calls_per_month as number)) * 100)}%` 
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Section (show only for free users) */}
      {!isPro && (
        <>
          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Yearly
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {plans.free.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">{plans.free.price}</span>
                <span className="text-slate-500">/{plans.free.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plans.free.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="w-4 h-4 text-slate-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg"
              >
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <Sparkles className="w-5 h-5 text-white/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                {plans.pro.name}
                {plans.pro.savings && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {plans.pro.savings}
                  </span>
                )}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold">{plans.pro.price}</span>
                <span className="text-white/70">{plans.pro.period}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-white/70 mb-4">{plans.pro.yearlyTotal}</p>
              )}
              <ul className="space-y-3 mb-6">
                {plans.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCheckout}
                disabled={actionLoading}
                className="w-full py-2.5 bg-white text-indigo-600 font-medium rounded-lg hover:bg-white/90 transition flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Upgrade to Pro
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payment Methods & Security */}
      <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>Cards, Bank Transfer, USSD</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Secured by Paystack</span>
        </div>
      </div>
    </div>
  )
}

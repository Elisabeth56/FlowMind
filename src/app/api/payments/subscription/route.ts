import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  getSubscription,
  disableSubscription,
  enableSubscription,
} from '@/lib/paystack/client'
import { isPro, quotaFor } from '@/lib/billing/entitlement'
import { DEMO_REFUSAL, isDemo } from '@/lib/demo'

// GET - the user's plan, Paystack subscription and AI usage this month
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: row, error: rowError }, usage] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.rpc('ai_units_this_month', { p_user_id: user.id }),
    ])
    if (rowError || usage.error) {
      throw new Error(rowError?.message ?? usage.error?.message)
    }

    const pro = isPro(row)
    const quota = quotaFor(row, usage.data ?? 0)

    // Plan details (price, next payment) come from Paystack, the source of truth for them
    const remote = row?.paystack_subscription_code
      ? await getSubscription(row.paystack_subscription_code)
      : null

    return NextResponse.json({
      success: true,
      subscription: remote
        ? {
            code: remote.subscription_code,
            status: remote.status,
            plan: remote.plan,
            amount: remote.amount,
            next_payment_date: remote.next_payment_date,
            created_at: remote.created_at,
          }
        : null,
      tier: pro ? 'pro' : 'free',
      status: row?.status ?? 'active',
      limits: {
        ai_calls_per_month: quota.limit ?? 'unlimited',
        ai_calls_used: quota.used,
        ai_calls_remaining: quota.remaining ?? 'unlimited',
      },
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
  }
}

// POST - cancel or reactivate
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDemo(user)) return NextResponse.json({ error: DEMO_REFUSAL }, { status: 403 })

    const { action } = await request.json()
    if (action !== 'cancel' && action !== 'reactivate') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: row } = await supabase
      .from('subscriptions')
      .select('paystack_subscription_code')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!row?.paystack_subscription_code) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    // Paystack needs the subscription's email token to change it
    const remote = await getSubscription(row.paystack_subscription_code)
    if (!remote) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const credentials = { code: remote.subscription_code, token: remote.email_token }
    if (action === 'cancel') {
      await disableSubscription(credentials)
    } else {
      await enableSubscription(credentials)
    }

    // Paystack has accepted the change; record it now rather than waiting for the webhook.
    const { error } = await createAdminClient()
      .from('subscriptions')
      .update({ status: action === 'cancel' ? 'non_renewing' : 'active' })
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)

    return NextResponse.json({
      success: true,
      message:
        action === 'cancel'
          ? 'Subscription will not renew. You have access until the end of your billing period.'
          : 'Subscription reactivated successfully.',
    })
  } catch (error) {
    console.error('Manage subscription error:', error)
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 })
  }
}

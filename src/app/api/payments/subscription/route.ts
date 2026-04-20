import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSubscription,
  disableSubscription,
  enableSubscription,
  getCustomer,
} from '@/lib/paystack/client'

// GET - Get current subscription details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // If no subscription, return free tier info
    if (!profile.paystack_subscription_code) {
      return NextResponse.json({
        success: true,
        subscription: null,
        tier: 'free',
        limits: {
          ai_calls_per_month: 50,
          ai_calls_used: profile.ai_calls_this_month,
          ai_calls_remaining: Math.max(0, 50 - profile.ai_calls_this_month),
        },
      })
    }

    // Get subscription details from Paystack
    const subscription = await getSubscription(profile.paystack_subscription_code)

    return NextResponse.json({
      success: true,
      subscription: subscription ? {
        code: subscription.subscription_code,
        status: subscription.status,
        plan: subscription.plan,
        amount: subscription.amount,
        next_payment_date: subscription.next_payment_date,
        created_at: subscription.created_at,
      } : null,
      tier: profile.subscription_tier,
      status: profile.subscription_status,
      limits: {
        ai_calls_per_month: profile.subscription_tier === 'pro' ? 'unlimited' : 50,
        ai_calls_used: profile.ai_calls_this_month,
        ai_calls_remaining: profile.subscription_tier === 'pro' 
          ? 'unlimited' 
          : Math.max(0, 50 - profile.ai_calls_this_month),
      },
    })

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

// POST - Manage subscription (cancel, reactivate)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'cancel' | 'reactivate'

    if (!['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.paystack_subscription_code) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    // Get subscription to get email_token
    const subscription = await getSubscription(profile.paystack_subscription_code)
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (action === 'cancel') {
      await disableSubscription({
        code: subscription.subscription_code,
        token: subscription.email_token,
      })

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'non_renewing',
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription will not renew. You have access until the end of your billing period.',
      })
    }

    if (action === 'reactivate') {
      await enableSubscription({
        code: subscription.subscription_code,
        token: subscription.email_token,
      })

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription reactivated successfully.',
      })
    }

  } catch (error) {
    console.error('Manage subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}

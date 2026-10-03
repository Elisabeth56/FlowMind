import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/billing/entitlement'
import {
  initializeTransaction,
  getCustomer,
  createCustomer,
  generateReference,
} from '@/lib/paystack/client'
import { PRO_PRICE_KOBO, type PaidPlanId } from '@/lib/plans'
import { publicEnv, serverEnv } from '@/lib/env'
import { DEMO_REFUSAL, isDemo } from '@/lib/demo'

// Read per request: plan codes are optional, and module scope runs during `next build`.
function planCode(plan: PaidPlanId): string | undefined {
  const env = serverEnv()
  return plan === 'pro_monthly' ? env.PAYSTACK_PRO_MONTHLY_PLAN_CODE : env.PAYSTACK_PRO_YEARLY_PLAN_CODE
}

const PLAN_AMOUNTS: Record<PaidPlanId, number> = {
  pro_monthly: PRO_PRICE_KOBO.monthly,
  pro_yearly: PRO_PRICE_KOBO.yearly,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDemo(user)) return NextResponse.json({ error: DEMO_REFUSAL }, { status: 403 })

    const body = await request.json()
    const { plan = 'pro_monthly' } = body

    // Validate plan
    if (plan !== 'pro_monthly' && plan !== 'pro_yearly') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    const planId: PaidPlanId = plan

    const code = planCode(planId)
    if (!code) {
      console.error(`Missing Paystack plan code for ${planId}`)
      return NextResponse.json(
        { error: 'Checkout is not configured yet. Please try again later.' },
        { status: 503 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Billing rows are server-owned: read with the user's session, write as the service role.
    const admin = createAdminClient()
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status, paystack_customer_code')
      .eq('user_id', user.id)
      .maybeSingle()

    if (isPro(subscription ?? null) && subscription?.status === 'active') {
      return NextResponse.json({ 
        error: 'Already subscribed to Pro',
        message: 'You already have an active Pro subscription'
      }, { status: 400 })
    }

    // Get or create Paystack customer
    let customerCode = subscription?.paystack_customer_code ?? null

    if (!customerCode) {
      // Check if customer exists by email
      let customer = await getCustomer(user.email!)

      if (!customer) {
        // Create new customer
        customer = await createCustomer({
          email: user.email!,
          first_name: profile.full_name?.split(' ')[0],
          last_name: profile.full_name?.split(' ').slice(1).join(' '),
          metadata: {
            user_id: user.id,
          },
        })
      }

      customerCode = customer.customer_code

      // Remember the customer, so webhooks can be matched back to this user
      const { error: saveError } = await admin
        .from('subscriptions')
        .upsert({ user_id: user.id, paystack_customer_code: customerCode }, { onConflict: 'user_id' })
      if (saveError) throw new Error(`Could not save Paystack customer: ${saveError.message}`)
    }

    // Initialize transaction with plan (creates subscription on success)
    const reference = generateReference('sub')
    
    // Paystack charges the plan amount, but the API still wants one passed
    const amount = PLAN_AMOUNTS[planId]

    const transaction = await initializeTransaction({
      email: user.email!,
      amount,
      reference,
      plan: code,
      callback_url: `${publicEnv().NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      metadata: {
        user_id: user.id,
        plan_type: planId,
      },
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    })

    // Store pending transaction
    const { error: txError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      reference,
      amount,
      plan_type: planId,
      status: 'pending',
    })
    // Without this row the callback can't tell who paid, so don't send them to pay.
    if (txError) throw new Error(`Could not store transaction: ${txError.message}`)

    return NextResponse.json({
      success: true,
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
      access_code: transaction.access_code,
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize checkout' },
      { status: 500 }
    )
  }
}

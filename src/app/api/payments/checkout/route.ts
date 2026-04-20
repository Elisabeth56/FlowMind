import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  initializeTransaction,
  getCustomer,
  createCustomer,
  generateReference,
} from '@/lib/paystack/client'

const PLANS = {
  pro_monthly: process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE!,
  pro_yearly: process.env.PAYSTACK_PRO_YEARLY_PLAN_CODE!,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan = 'pro_monthly' } = body

    // Validate plan
    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
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

    // Check if already on Pro
    if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
      return NextResponse.json({ 
        error: 'Already subscribed to Pro',
        message: 'You already have an active Pro subscription'
      }, { status: 400 })
    }

    // Get or create Paystack customer
    let customerCode = profile.paystack_customer_code

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

      // Save customer code to profile
      await supabase
        .from('profiles')
        .update({ paystack_customer_code: customerCode })
        .eq('id', user.id)
    }

    // Initialize transaction with plan (creates subscription on success)
    const reference = generateReference('sub')
    
    const transaction = await initializeTransaction({
      email: user.email!,
      // Amount is set by the plan, but we need to pass something
      // Paystack will use the plan amount
      amount: plan === 'pro_yearly' ? 4800000 : 500000, // ₦48,000 or ₦5,000 in kobo
      reference,
      plan: PLANS[plan as keyof typeof PLANS],
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      metadata: {
        user_id: user.id,
        plan_type: plan,
      },
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    })

    // Store pending transaction
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      reference,
      amount: plan === 'pro_yearly' ? 4800000 : 500000,
      plan_type: plan,
      status: 'pending',
    })

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

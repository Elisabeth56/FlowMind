import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/paystack/client'

// Paystack webhook events we care about
type PaystackEvent =
  | 'charge.success'
  | 'subscription.create'
  | 'subscription.disable'
  | 'subscription.not_renew'
  | 'invoice.create'
  | 'invoice.payment_failed'
  | 'invoice.update'

interface PaystackWebhookPayload {
  event: PaystackEvent
  data: {
    id: number
    reference?: string
    status?: string
    amount?: number
    customer?: {
      id: number
      email: string
      customer_code: string
    }
    subscription_code?: string
    plan?: {
      plan_code: string
      name: string
      interval: string
    }
    authorization?: {
      authorization_code: string
      card_type: string
      last4: string
    }
    next_payment_date?: string
    // For invoice events
    subscription?: {
      subscription_code: string
      status: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const payload = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: PaystackWebhookPayload = JSON.parse(payload)
    const supabase = createAdminClient()

    console.log('Paystack webhook:', event.event, event.data)

    switch (event.event) {
      case 'charge.success': {
        // Payment successful - could be one-time or subscription
        const { customer, reference, amount } = event.data

        if (customer && reference) {
          // Log the successful charge
          await supabase.from('payment_transactions').upsert({
            reference,
            paystack_transaction_id: event.data.id,
            amount,
            status: 'success',
            verified_at: new Date().toISOString(),
          }, {
            onConflict: 'reference',
          })
        }
        break
      }

      case 'subscription.create': {
        // New subscription created
        const { customer, subscription_code, plan, next_payment_date } = event.data

        if (customer) {
          // Find user by Paystack customer code
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_customer_code', customer.customer_code)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_tier: 'pro',
                subscription_status: 'active',
                paystack_subscription_code: subscription_code,
                subscription_plan: plan?.interval === 'annually' ? 'pro_yearly' : 'pro_monthly',
                subscription_started_at: new Date().toISOString(),
                subscription_next_payment: next_payment_date,
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      case 'subscription.disable': {
        // Subscription cancelled
        const { customer, subscription_code } = event.data

        if (customer) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_customer_code', customer.customer_code)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'canceled',
                subscription_ended_at: new Date().toISOString(),
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      case 'subscription.not_renew': {
        // Subscription won't renew (user cancelled but still active until period ends)
        const { customer } = event.data

        if (customer) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_customer_code', customer.customer_code)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'non_renewing',
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        // Subscription payment failed
        const { subscription } = event.data

        if (subscription) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_subscription_code', subscription.subscription_code)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      case 'invoice.update': {
        // Invoice paid or status changed
        const { subscription } = event.data

        if (subscription?.status === 'success') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('paystack_subscription_code', subscription.subscription_code)
            .single()

          if (profile) {
            // Reset AI calls on successful renewal
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                ai_calls_this_month: 0,
                ai_calls_reset_at: new Date().toISOString(),
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      default:
        console.log('Unhandled Paystack event:', event.event)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

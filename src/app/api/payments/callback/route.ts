import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')
  
  const ref = reference || trxref

  if (!ref) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=missing_reference`
    )
  }

  try {
    // Verify the transaction with Paystack
    const transaction = await verifyTransaction(ref)

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Update transaction record
    await supabase
      .from('payment_transactions')
      .update({
        status: transaction.status,
        paystack_transaction_id: transaction.id,
        verified_at: new Date().toISOString(),
      })
      .eq('reference', ref)

    if (transaction.status === 'success') {
      // Get the user_id from the transaction metadata or payment_transactions table
      const { data: txRecord } = await supabase
        .from('payment_transactions')
        .select('user_id, plan_type')
        .eq('reference', ref)
        .single()

      if (txRecord) {
        // Promote to Pro and reset the usage counter in a single write
        const now = new Date().toISOString()
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'pro',
            subscription_status: 'active',
            paystack_customer_code: transaction.customer.customer_code,
            subscription_plan: txRecord.plan_type,
            subscription_started_at: now,
            ai_calls_this_month: 0,
            ai_calls_reset_at: now,
          })
          .eq('id', txRecord.user_id)
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dash/settings/billing?success=true`
      )
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=payment_failed`
      )
    }

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=verification_failed`
    )
  }
}

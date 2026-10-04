import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack/client'
import { publicEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')
  
  const ref = reference || trxref

  if (!ref) {
    return NextResponse.redirect(
      `${publicEnv().NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=missing_reference`
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
        .select('user_id, plan_type, amount')
        .eq('reference', ref)
        .single()

      // Only what we asked to be paid counts: the amount must cover the plan.
      if (!txRecord || transaction.amount < txRecord.amount) {
        return NextResponse.redirect(
          `${publicEnv().NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=verification_failed`
        )
      }

      // The webhook does the same; whichever arrives first wins and the other is a no-op.
      const { error: upgradeError } = await supabase.from('subscriptions').upsert(
        {
          user_id: txRecord.user_id,
          tier: 'pro',
          status: 'active',
          plan: txRecord.plan_type,
          paystack_customer_code: transaction.customer.customer_code,
          ended_at: null,
        },
        { onConflict: 'user_id' }
      )
      if (upgradeError) throw new Error(upgradeError.message)

      return NextResponse.redirect(
        `${publicEnv().NEXT_PUBLIC_APP_URL}/dash/settings/billing?success=true`
      )
    } else {
      return NextResponse.redirect(
        `${publicEnv().NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=payment_failed`
      )
    }

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(
      `${publicEnv().NEXT_PUBLIC_APP_URL}/dash/settings/billing?error=verification_failed`
    )
  }
}

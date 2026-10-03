import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { disableSubscription, getSubscription } from '@/lib/paystack/client'

// DELETE - remove the account and everything in it. The auth user is deleted with the
// service role; every table hangs off profiles with ON DELETE CASCADE, so the rows go
// with it (supabase/tests/account.test.sql).
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The typed confirmation is checked here too, not only in the form
    const { confirm } = await request.json().catch(() => ({}))
    if (typeof confirm !== 'string' || confirm.trim().toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Type your email address to confirm' }, { status: 400 })
    }

    // Stop a paid subscription first: an account that no longer exists must not be charged
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, paystack_subscription_code')
      .eq('user_id', user.id)
      .maybeSingle()
    if (subscription?.paystack_subscription_code && subscription.status === 'active') {
      const remote = await getSubscription(subscription.paystack_subscription_code)
      if (!remote) {
        return NextResponse.json(
          { error: 'Could not reach Paystack to stop your subscription. Nothing was deleted; try again shortly.' },
          { status: 502 }
        )
      }
      await disableSubscription({ code: remote.subscription_code, token: remote.email_token })
    }

    const { error } = await createAdminClient().auth.admin.deleteUser(user.id)
    if (error) throw new Error(error.message)

    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Could not delete your account. Nothing was removed.' }, { status: 500 })
  }
}

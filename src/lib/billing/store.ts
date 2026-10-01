// The real BillingStore: Supabase through the service role.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/models'
import type { BillingStore } from './webhook'

const UNIQUE_VIOLATION = '23505'

function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`)
}

export function supabaseBillingStore(admin: SupabaseClient<Database>): BillingStore {
  return {
    async claimEvent(key, type, payload) {
      const { error } = await admin
        .from('payment_events')
        .insert({ event_key: key, event_type: type, payload: payload as Json })
      if (!error) return true
      if (error.code !== UNIQUE_VIOLATION) throw new Error(`Could not record payment event: ${error.message}`)

      // Seen before. Apply it again only if the earlier attempt never finished.
      const { data, error: readError } = await admin
        .from('payment_events')
        .select('processed_at')
        .eq('event_key', key)
        .single()
      check(readError, 'Could not read payment event')
      return data?.processed_at == null
    },

    async completeEvent(key) {
      const { error } = await admin
        .from('payment_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('event_key', key)
      check(error, 'Could not complete payment event')
    },

    async userIdForCustomer(customerCode) {
      const { data, error } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('paystack_customer_code', customerCode)
        .maybeSingle()
      check(error, 'Could not look up customer')
      return data?.user_id ?? null
    },

    async userIdForSubscription(subscriptionCode) {
      const { data, error } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('paystack_subscription_code', subscriptionCode)
        .maybeSingle()
      check(error, 'Could not look up subscription')
      return data?.user_id ?? null
    },

    async updateSubscription(userId, patch) {
      const { error } = await admin
        .from('subscriptions')
        .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
      check(error, 'Could not update subscription')
    },

    async markTransactionPaid(reference, paystackTransactionId) {
      const { error } = await admin
        .from('payment_transactions')
        .update({
          paystack_transaction_id: paystackTransactionId,
          status: 'success',
          verified_at: new Date().toISOString(),
        })
        .eq('reference', reference)
      check(error, 'Could not update transaction')
    },
  }
}

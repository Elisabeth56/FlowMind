// Applies a Paystack webhook delivery to our billing state, exactly once.
// The storage is passed in so the rules can be tested without a database.
import crypto from 'node:crypto'

export type SubscriptionPatch = {
  tier?: 'free' | 'pro'
  status?: 'active' | 'non_renewing' | 'past_due' | 'canceled'
  plan?: 'pro_monthly' | 'pro_yearly'
  paystack_subscription_code?: string
  started_at?: string
  ended_at?: string | null
  next_payment_at?: string | null
}

export interface BillingStore {
  /** Records the delivery. Resolves false when it has already been applied. */
  claimEvent(key: string, type: string, payload: unknown): Promise<boolean>
  completeEvent(key: string): Promise<void>
  userIdForCustomer(customerCode: string): Promise<string | null>
  userIdForSubscription(subscriptionCode: string): Promise<string | null>
  updateSubscription(userId: string, patch: SubscriptionPatch): Promise<void>
  markTransactionPaid(reference: string, paystackTransactionId: number): Promise<void>
}

type PaystackEvent = {
  event: string
  data: {
    id?: number
    reference?: string
    paid?: boolean | number
    status?: string
    customer?: { customer_code?: string }
    subscription_code?: string
    plan?: { interval?: string }
    next_payment_date?: string | null
    subscription?: { subscription_code?: string; next_payment_date?: string | null }
  }
}

export type WebhookResult = 'applied' | 'duplicate' | 'ignored'

/** Paystack sends no event id; a retried delivery carries the same bytes. */
export function eventKey(rawBody: string): string {
  return crypto.createHash('sha256').update(rawBody).digest('hex')
}

export async function processPaystackEvent(
  store: BillingStore,
  rawBody: string,
  now: () => Date = () => new Date()
): Promise<WebhookResult> {
  const event = JSON.parse(rawBody) as PaystackEvent
  const key = eventKey(rawBody)

  if (!(await store.claimEvent(key, event.event, event))) return 'duplicate'

  const applied = await apply(store, event, now().toISOString())
  // Only marked done after the change is written, so a delivery that failed halfway
  // is applied again when Paystack retries it.
  await store.completeEvent(key)
  return applied ? 'applied' : 'ignored'
}

async function apply(store: BillingStore, event: PaystackEvent, now: string): Promise<boolean> {
  const { data } = event
  const customerCode = data.customer?.customer_code
  const invoiceSubscription = data.subscription?.subscription_code

  switch (event.event) {
    case 'charge.success': {
      if (!data.reference || data.id === undefined) return false
      await store.markTransactionPaid(data.reference, data.id)
      return true
    }

    case 'subscription.create': {
      const userId = customerCode ? await store.userIdForCustomer(customerCode) : null
      if (!userId) return false
      await store.updateSubscription(userId, {
        tier: 'pro',
        status: 'active',
        plan: data.plan?.interval === 'annually' ? 'pro_yearly' : 'pro_monthly',
        paystack_subscription_code: data.subscription_code,
        started_at: now,
        ended_at: null,
        next_payment_at: data.next_payment_date ?? null,
      })
      return true
    }

    // The user cancelled: Pro stays until the period they paid for runs out.
    case 'subscription.not_renew': {
      const userId = customerCode ? await store.userIdForCustomer(customerCode) : null
      if (!userId) return false
      await store.updateSubscription(userId, { status: 'non_renewing', next_payment_at: null })
      return true
    }

    // The subscription is over: back to the free plan.
    case 'subscription.disable': {
      const userId = customerCode ? await store.userIdForCustomer(customerCode) : null
      if (!userId) return false
      await store.updateSubscription(userId, { tier: 'free', status: 'canceled', ended_at: now, next_payment_at: null })
      return true
    }

    case 'invoice.payment_failed': {
      const userId = invoiceSubscription ? await store.userIdForSubscription(invoiceSubscription) : null
      if (!userId) return false
      await store.updateSubscription(userId, { status: 'past_due' })
      return true
    }

    case 'invoice.update': {
      if (!data.paid && data.status !== 'success') return false
      const userId = invoiceSubscription ? await store.userIdForSubscription(invoiceSubscription) : null
      if (!userId) return false
      await store.updateSubscription(userId, {
        tier: 'pro',
        status: 'active',
        ...(data.subscription?.next_payment_date ? { next_payment_at: data.subscription.next_payment_date } : {}),
      })
      return true
    }

    default:
      return false
  }
}

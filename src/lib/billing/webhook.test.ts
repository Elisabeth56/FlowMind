import { describe, expect, it } from 'vitest'
import { processPaystackEvent, type BillingStore, type SubscriptionPatch } from './webhook'

function fakeStore() {
  const events = new Map<string, { processed: boolean }>()
  const subscriptions = new Map<string, SubscriptionPatch & { paystack_customer_code: string }>([
    ['user-1', { paystack_customer_code: 'CUS_1', tier: 'free', status: 'active' }],
  ])
  const paid: string[] = []
  let writes = 0

  const store: BillingStore = {
    async claimEvent(key) {
      if (events.get(key)?.processed) return false
      events.set(key, { processed: false })
      return true
    },
    async completeEvent(key) {
      events.set(key, { processed: true })
    },
    async userIdForCustomer(code) {
      for (const [id, sub] of subscriptions) if (sub.paystack_customer_code === code) return id
      return null
    },
    async userIdForSubscription(code) {
      for (const [id, sub] of subscriptions) if (sub.paystack_subscription_code === code) return id
      return null
    },
    async updateSubscription(userId, patch) {
      writes += 1
      subscriptions.set(userId, { ...subscriptions.get(userId)!, ...patch })
    },
    async markTransactionPaid(reference) {
      writes += 1
      paid.push(reference)
    },
  }
  return { store, subscriptions, paid, writes: () => writes }
}

const created = JSON.stringify({
  event: 'subscription.create',
  data: {
    customer: { customer_code: 'CUS_1' },
    subscription_code: 'SUB_1',
    plan: { interval: 'annually' },
    next_payment_date: '2027-10-01T00:00:00.000Z',
  },
})
const at = () => new Date('2026-10-01T09:00:00.000Z')

describe('processPaystackEvent', () => {
  it('upgrades the customer when a subscription is created', async () => {
    const { store, subscriptions } = fakeStore()
    expect(await processPaystackEvent(store, created, at)).toBe('applied')
    expect(subscriptions.get('user-1')).toMatchObject({
      tier: 'pro',
      status: 'active',
      plan: 'pro_yearly',
      paystack_subscription_code: 'SUB_1',
      started_at: '2026-10-01T09:00:00.000Z',
    })
  })

  it('changes nothing when the same delivery arrives a second time', async () => {
    const { store, subscriptions, writes } = fakeStore()
    await processPaystackEvent(store, created, at)
    const before = structuredClone(subscriptions.get('user-1'))

    const later = () => new Date('2026-10-02T09:00:00.000Z')
    expect(await processPaystackEvent(store, created, later)).toBe('duplicate')
    expect(subscriptions.get('user-1')).toEqual(before)
    expect(writes()).toBe(1)
  })

  it('applies a delivery again if the first attempt failed before finishing', async () => {
    const { store, subscriptions } = fakeStore()
    const failing: BillingStore = {
      ...store,
      updateSubscription: async () => {
        throw new Error('database unavailable')
      },
    }
    await expect(processPaystackEvent(failing, created, at)).rejects.toThrow('database unavailable')
    expect(await processPaystackEvent(store, created, at)).toBe('applied')
    expect(subscriptions.get('user-1')?.tier).toBe('pro')
  })

  it('keeps Pro on cancel and returns to free when the subscription is disabled', async () => {
    const { store, subscriptions } = fakeStore()
    await processPaystackEvent(store, created, at)

    const event = (name: string) => JSON.stringify({ event: name, data: { customer: { customer_code: 'CUS_1' } } })
    await processPaystackEvent(store, event('subscription.not_renew'), at)
    expect(subscriptions.get('user-1')).toMatchObject({ tier: 'pro', status: 'non_renewing' })

    await processPaystackEvent(store, event('subscription.disable'), at)
    expect(subscriptions.get('user-1')).toMatchObject({ tier: 'free', status: 'canceled' })
  })

  it('marks a renewal that failed as past due', async () => {
    const { store, subscriptions } = fakeStore()
    await processPaystackEvent(store, created, at)
    const failed = JSON.stringify({ event: 'invoice.payment_failed', data: { subscription: { subscription_code: 'SUB_1' } } })
    expect(await processPaystackEvent(store, failed, at)).toBe('applied')
    expect(subscriptions.get('user-1')?.status).toBe('past_due')
  })

  it('ignores events for customers it does not know', async () => {
    const { store, writes } = fakeStore()
    const stranger = JSON.stringify({ event: 'subscription.create', data: { customer: { customer_code: 'CUS_404' } } })
    expect(await processPaystackEvent(store, stranger, at)).toBe('ignored')
    expect(writes()).toBe(0)
  })
})

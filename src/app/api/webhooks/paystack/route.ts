import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/paystack/client'
import { supabaseBillingStore } from '@/lib/billing/store'
import { processPaystackEvent } from '@/lib/billing/webhook'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-paystack-signature')
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const payload = await request.text()
  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const result = await processPaystackEvent(supabaseBillingStore(createAdminClient()), payload)
    return NextResponse.json({ received: true, result })
  } catch (error) {
    // A 500 makes Paystack retry; the delivery is not marked done, so the retry applies it.
    console.error('Paystack webhook failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

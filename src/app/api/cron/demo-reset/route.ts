import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'
import { DEMO_EMAIL, DEMO_USER_ID } from '@/lib/demo'

// GET - run nightly by Vercel Cron (vercel.json). Puts the demo account back to its
// seeded week and undoes anything a visitor did to its sign-in. Being a daily query, it
// also keeps a free Supabase project from pausing for inactivity.
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET
  // Vercel sends the secret as a bearer token; without one configured nobody may run this
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    // The demo user: created on the first run, then put back each night. A visitor
    // holds a real session, so they could have set a password; replace it with one nobody knows.
    const account = { email: DEMO_EMAIL, email_confirm: true, password: randomBytes(24).toString('base64url') }
    const { data: existing } = await admin.auth.admin.getUserById(DEMO_USER_ID)
    const { error: userError } = existing.user
      ? await admin.auth.admin.updateUserById(DEMO_USER_ID, account)
      : await admin.auth.admin.createUser({ id: DEMO_USER_ID, ...account, user_metadata: { full_name: 'Tolu Adebayo' } })
    if (userError) throw new Error(`Demo user: ${userError.message}`)

    const { error } = await admin.rpc('reset_demo')
    if (error) throw new Error(`reset_demo: ${error.message}`)

    return NextResponse.json({ success: true, reset_at: new Date().toISOString() })
  } catch (error) {
    console.error('Demo reset error:', error)
    return NextResponse.json({ error: 'Demo reset failed' }, { status: 500 })
  }
}

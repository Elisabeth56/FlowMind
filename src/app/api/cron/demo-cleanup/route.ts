import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'

// GET - run nightly by Vercel Cron (vercel.json). Deletes demo accounts older than a day,
// with everything in them. Being a daily query, it also keeps a free Supabase project
// from pausing for inactivity.
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET
  // Vercel sends the secret as a bearer token; without one configured nobody may run this
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: removed, error } = await createAdminClient().rpc('purge_demo_users')
  if (error) {
    console.error('Demo cleanup error:', error)
    return NextResponse.json({ error: 'Demo cleanup failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true, removed })
}

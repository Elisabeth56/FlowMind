import { randomBytes, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { DEMO_MAX_ACCOUNTS } from '@/lib/demo'

// POST - "Try the demo": make the visitor an account of their own, fill it with the
// seeded week and sign them in. Nothing they do is seen by anyone else, and the account
// is deleted a day later (/api/cron/demo-cleanup).
export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const to = (path: string) => NextResponse.redirect(`${origin}${path}`, 303) // 303: follow the form post with a GET

  try {
    const supabase = await createClient()
    // Already signed in, to a demo or a real account: go to it rather than make another
    const { data: { user: current } } = await supabase.auth.getUser()
    if (current) return to('/dash')

    const admin = createAdminClient()
    const { data: usage, error: usageError } = await admin.rpc('demo_usage').single()
    if (usageError) throw new Error(usageError.message)
    if (usage.accounts >= DEMO_MAX_ACCOUNTS) return to('/login?error=demo_busy')

    // The address never receives mail: it is confirmed here and only names the account
    const email = `demo-${randomUUID()}@elisabethnnamani.dev`
    const password = randomBytes(24).toString('base64url')
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { demo: true },
      user_metadata: { full_name: 'Tolu Adebayo', timezone: 'Africa/Lagos' },
    })
    if (createError || !created.user) throw new Error(createError?.message ?? 'No user was created')

    const { error: seedError } = await admin.rpc('seed_demo', { p_user: created.user.id })
    if (seedError) {
      // Don't leave an empty account behind
      await admin.auth.admin.deleteUser(created.user.id)
      throw new Error(seedError.message)
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw new Error(signInError.message)

    return to('/dash')
  } catch (error) {
    console.error('Demo sign-in error:', error)
    return to('/login?error=demo_unavailable')
  }
}

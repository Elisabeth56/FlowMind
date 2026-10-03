import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'

// POST - sign the visitor into the shared demo account. The demo user has no password
// anyone knows: the server mints a one-time sign-in token for it and uses it at once.
export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  try {
    const admin = createAdminClient()
    const { data: found } = await admin.auth.admin.getUserById(DEMO_USER_ID)
    const email = found.user?.email
    if (!email) throw new Error('The demo user does not exist')

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (linkError) throw new Error(linkError.message)

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
    if (error) throw new Error(error.message)

    // 303 so the browser follows the form post with a GET
    return NextResponse.redirect(`${origin}/dash`, 303)
  } catch (error) {
    console.error('Demo sign-in error:', error)
    return NextResponse.redirect(`${origin}/login?error=demo_unavailable`, 303)
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { publicEnv } from '@/lib/env'
import { authErrorMessage, MIN_PASSWORD_LENGTH, safeNext } from '@/lib/auth'
import { safeTimeZone } from '@/lib/dates'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: authErrorMessage(error) }

  revalidatePath('/', 'layout')
  // Back to the page they were sent to sign in from, if there was one
  redirect(safeNext(formData.get('next') as string | null))
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
        // The browser's timezone becomes the profile's, so "today" is right from day one
        timezone: safeTimeZone(formData.get('timezone') as string | null),
      },
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (error) return { error: authErrorMessage(error) }

  // Supabase answers a sign-up for an existing address with a user that has no identities
  if (data.user?.identities?.length === 0) {
    return { error: authErrorMessage({ code: 'user_already_exists' }) }
  }

  // Email confirmation is on: there is a user but no session until they click the link
  if (data.user && !data.session) {
    return { success: true, message: 'Check your email for a link to confirm your account.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dash')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${publicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error) return { error: authErrorMessage(error) }

  if (data.url) redirect(data.url)
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(formData.get('email') as string, {
    redirectTo: `${publicEnv().NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  })
  // Only a rate limit is worth reporting. Anything else gets the same answer as success,
  // so this form cannot be used to find out which addresses have an account.
  if (error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit') {
    return { error: authErrorMessage(error) }
  }
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  // Only someone who arrived through a reset link (or is signed in) has a session here
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: authErrorMessage({ code: 'otp_expired' }) }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: authErrorMessage(error) }

  revalidatePath('/', 'layout')
  redirect('/dash')
}

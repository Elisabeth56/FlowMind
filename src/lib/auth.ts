// Small pieces shared by the auth routes, actions and pages.

/**
 * Where to send someone after signing in. Only paths inside this app are allowed:
 * anything else (another site, `//host`, a backslash trick) falls back to the inbox,
 * so a crafted link cannot bounce a signed-in user to someone else's page.
 */
export function safeNext(next: string | null | undefined, fallback = '/dash'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  return next
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password do not match. Check them and try again.',
  email_not_confirmed: 'Confirm your email first. We sent you a link when you signed up.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'That password is too easy to guess. Use at least 8 characters with a number and a capital letter.',
  same_password: 'That is your current password. Choose a different one.',
  over_email_send_rate_limit: 'We have sent too many emails to this address. Wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  otp_expired: 'That link has expired or was already used. Ask for a new one.',
  session_not_found: 'Your session has ended. Sign in again.',
  validation_failed: 'Check the email address and try again.',
  signup_disabled: 'New sign-ups are closed right now.',
  provider_disabled: 'That sign-in method is not available right now.',
}

/** What to tell the user when Supabase Auth refuses something. Never the raw error. */
export function authErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  return (error?.code && MESSAGES[error.code]) || 'Something went wrong on our side. Try again in a moment.'
}

/** Messages for the `?error=` codes our own routes put on the login URL. */
export const LOGIN_NOTICES: Record<string, string> = {
  demo_busy: 'A lot of people are trying the demo right now. Try again later, or create a free account.',
  demo_unavailable: 'The demo is not available right now. You can create a free account instead.',
  auth_failed: 'We could not complete that sign-in. Try again.',
  link_expired: 'That link has expired or was already used. Ask for a new one.',
}

export const MIN_PASSWORD_LENGTH = 8

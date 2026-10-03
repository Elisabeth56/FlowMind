// The shared demo account: one seeded user anyone can enter from the landing page.
// Its data is put back every night by reset_demo() (supabase/migrations/…demo_account.sql).

export const DEMO_USER_ID = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'
export const DEMO_EMAIL = 'demo@elisabethnnamani.dev'

// The demo is on Pro, and everyone who tries it shares one model key. This is the most
// AI units it may use between two nightly resets.
export const DEMO_DAILY_AI_UNITS = 150

export function isDemo(userId: string | null | undefined): boolean {
  return userId === DEMO_USER_ID
}

/** What the demo answers when asked to do something only a real account should. */
export const DEMO_REFUSAL = 'That is switched off in the shared demo. Create a free account to use it.'

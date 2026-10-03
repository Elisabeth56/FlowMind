// The demo: "Try the demo" gives each visitor a private account filled with a seeded
// week (seed_demo() in SQL), deleted a day later by the nightly cleanup.

/** A demo account is marked in its app metadata, which only the server can write. */
export function isDemo(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.app_metadata?.demo === true
}

// Demo accounts are on Pro and all share one model key, so their AI use is capped twice:
// per account, and across every demo account, over the last 24 hours.
export const DEMO_AI_UNITS_PER_ACCOUNT = 30
export const DEMO_AI_UNITS_ALL_ACCOUNTS = 600

// More live demo accounts than this and "Try the demo" asks the visitor to come back later.
// Each holds about 50 rows, so this is a guard against a script, not a capacity limit.
export const DEMO_MAX_ACCOUNTS = 300

export type DemoUsage = { accounts: number; ai_units_today: number }

/** Why a demo account may not make another AI call, or null when it may. */
export function demoAiRefusal(usedByAccount: number, usedByAllDemos: number, cost: number): string | null {
  if (usedByAccount + cost > DEMO_AI_UNITS_PER_ACCOUNT) {
    return 'This demo has used its AI actions. Create a free account to keep going.'
  }
  if (usedByAllDemos + cost > DEMO_AI_UNITS_ALL_ACCOUNTS) {
    return 'The demo is busy today and its AI actions are used up. Create a free account to keep going.'
  }
  return null
}

/** What a demo account answers when asked to do something only a real account should. */
export const DEMO_REFUSAL = 'That is switched off in the demo. Create a free account to use it.'

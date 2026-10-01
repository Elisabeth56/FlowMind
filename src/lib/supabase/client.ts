import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Browser Supabase client. Memoised so hooks that list it as an effect
 * dependency don't tear down and rebuild their realtime channels on
 * every render.
 */
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      publicEnv().NEXT_PUBLIC_SUPABASE_URL,
      publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return client
}

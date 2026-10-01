// Server-side quota check and usage log. Reads use the caller's session (row level
// security limits them to their own rows); writes go through the service role,
// because users have no right to write `ai_runs`.
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/models'
import { quotaFor, type Quota, type SubscriptionState } from './entitlement'

type Client = SupabaseClient<Database>
export type AiOperation = 'organize' | 'daily_plan' | 'ask' | 'weekly_summary'

export async function getSubscriptionState(supabase: Client, userId: string): Promise<SubscriptionState> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Could not read subscription: ${error.message}`)
  return data
}

export async function getQuota(supabase: Client, userId: string, cost = 1): Promise<Quota> {
  const [subscription, usage] = await Promise.all([
    getSubscriptionState(supabase, userId),
    supabase.rpc('ai_units_this_month', { p_user_id: userId }),
  ])
  // Fail closed: if usage can't be read, don't hand out free model calls.
  if (usage.error) throw new Error(`Could not read AI usage: ${usage.error.message}`)
  return quotaFor(subscription, usage.data ?? 0, cost)
}

export function quotaExceededBody(quota: Quota) {
  return { error: 'Free tier limit reached', limit: quota.limit, used: quota.used }
}

/** Records one model call. Never throws: losing a log line must not fail the request. */
export async function recordAiRun(run: {
  userId: string
  operation: AiOperation
  units?: number
  model?: string
  latencyMs?: number
  success?: boolean
  error?: string
}): Promise<void> {
  try {
    const { error } = await createAdminClient().from('ai_runs').insert({
      user_id: run.userId,
      operation: run.operation,
      units: run.units ?? 1,
      model: run.model,
      latency_ms: run.latencyMs,
      success: run.success ?? true,
      error: run.error,
    })
    if (error) console.error('Could not record AI run:', error.message)
  } catch (error) {
    console.error('Could not record AI run:', error)
  }
}

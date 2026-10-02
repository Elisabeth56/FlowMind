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

// Model calls per user per minute, counted from the usage log so it holds across
// serverless instances. High enough for organising a full inbox, low enough to stop a loop.
const AI_CALLS_PER_MINUTE = 30

type Refusal = { status: 429; body: { error: string; limit?: number | null; used?: number } }

/** The one check every AI route makes before calling a model. Null means go ahead. */
export async function refuseAiCall(supabase: Client, userId: string, cost = 1): Promise<Refusal | null> {
  const quota = await getQuota(supabase, userId, cost)
  if (!quota.allowed) {
    return { status: 429, body: { error: 'Free tier limit reached', limit: quota.limit, used: quota.used } }
  }

  const { count, error } = await supabase
    .from('ai_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
  if (error) throw new Error(`Could not read AI usage: ${error.message}`)
  if ((count ?? 0) >= AI_CALLS_PER_MINUTE) {
    return { status: 429, body: { error: 'Too many requests. Try again in a minute.' } }
  }
  return null
}

export type AiRunRecord = {
  userId: string
  operation: AiOperation
  units?: number
  provider?: string
  model?: string
  promptVersion?: string
  inputTokens?: number
  outputTokens?: number
  latencyMs?: number
  success: boolean
  error?: string
}

/** Records one model call. Never throws: losing a log line must not fail the request. */
export async function recordAiRun(run: AiRunRecord): Promise<void> {
  try {
    const { error } = await createAdminClient().from('ai_runs').insert({
      user_id: run.userId,
      operation: run.operation,
      units: run.units ?? 1,
      provider: run.provider,
      model: run.model,
      prompt_version: run.promptVersion,
      input_tokens: run.inputTokens,
      output_tokens: run.outputTokens,
      latency_ms: run.latencyMs,
      success: run.success,
      error: run.error,
    })
    if (error) console.error('Could not record AI run:', error.message)
  } catch (error) {
    console.error('Could not record AI run:', error)
  }
}

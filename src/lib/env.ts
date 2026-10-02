// Validated environment. Public values are read with literal `process.env.NEXT_PUBLIC_*`
// so Next can inline them into the browser bundle; secrets are server-only and checked
// on first use (and once at server start, see src/instrumentation.ts).
import { z } from 'zod'

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  // Optional: without it there is no fallback provider when Groq is unavailable.
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  // Optional: checkout answers 503 until the plans exist in Paystack.
  PAYSTACK_PRO_MONTHLY_PLAN_CODE: z.string().optional(),
  PAYSTACK_PRO_YEARLY_PLAN_CODE: z.string().optional(),
})

export type PublicEnv = z.infer<typeof publicSchema>
export type ServerEnv = z.infer<typeof serverSchema>

/** Parses env values and throws one message naming every missing or invalid variable. */
export function parseEnv<T extends z.ZodType>(schema: T, values: Record<string, unknown>): z.infer<T> {
  const result = schema.safeParse(values)
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
    throw new Error(`Missing or invalid environment variables: ${names.join(', ')}. See .env.example.`)
  }
  return result.data
}

let publicCache: PublicEnv | undefined
let serverCache: ServerEnv | undefined

/** Browser-safe values. Safe to call from client and server code. */
export function publicEnv(): PublicEnv {
  publicCache ??= parseEnv(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
  return publicCache
}

/** Secrets. Server code only; never import into a client component. */
export function serverEnv(): ServerEnv {
  if (typeof window !== 'undefined') throw new Error('serverEnv() was called in the browser')
  serverCache ??= parseEnv(serverSchema, process.env)
  return serverCache
}

// The only place the app talks to a model provider. Two calls: `generate()` for
// zod-validated structured output and `stream()` for text. Both try Groq's model for
// the job, then Groq's other model, then Gemini if a key is set; both have a timeout
// and log one `ai_runs` row per attempt.
import { generateObject, streamObject, streamText, JSONParseError, NoObjectGeneratedError, TypeValidationError, type LanguageModel } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { z } from 'zod'
import { serverEnv } from '@/lib/env'
import { recordAiRun, type AiOperation, type AiRunRecord } from '@/lib/billing/quota'
import { renderPrompt, type PromptName } from './prompt'

/** fast: classification and extraction. smart: planning and writing. */
export type Tier = 'fast' | 'smart'

export type Target = { provider: string; model: string; languageModel: LanguageModel }

// Swapping a model or a provider is a change to this table.
// Checked against both providers' model pages on 2026-10-02: Groq retired its Llama
// models from the free tier on 2026-08-16, and Gemini 2.5 is closed to new projects.
const MODELS = {
  groq: { fast: 'openai/gpt-oss-20b', smart: 'openai/gpt-oss-120b' },
  google: { fast: 'gemini-3.5-flash-lite', smart: 'gemini-3.8-flash' },
} as const

// The schema goes to the provider (JSON schema mode). Best-effort rather than strict:
// strict mode refuses schema keywords we rely on, and zod validates the answer anyway.
// These are reasoning models; this work needs little of it, and low keeps them fast.
const PROVIDER_OPTIONS = { groq: { strictJsonSchema: false, reasoningEffort: 'low' } } as const

const TIMEOUT_MS: Record<Tier, number> = { fast: 12_000, smart: 25_000 }
const TEMPERATURE: Record<Tier, number> = { fast: 0.1, smart: 0.3 }

/**
 * Models in the order they are tried: the Groq model for the tier, then Groq's other
 * model (limits are per model, so one can be exhausted while the other is not), then
 * Gemini if its key is set.
 */
export function defaultTargets(tier: Tier): Target[] {
  const env = serverEnv()
  const groq = createGroq({ apiKey: env.GROQ_API_KEY })
  const other: Tier = tier === 'fast' ? 'smart' : 'fast'
  const targets: Target[] = [tier, other].map((t) => ({
    provider: 'groq',
    model: MODELS.groq[t],
    languageModel: groq(MODELS.groq[t]),
  }))
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    targets.push({
      provider: 'google',
      model: MODELS.google[tier],
      languageModel: createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })(MODELS.google[tier]),
    })
  }
  return targets
}

/** What a route needs to know when a call fails: is it us, or is it the model's answer? */
export class AiError extends Error {
  constructor(
    public readonly kind: 'unavailable' | 'invalid_output',
    message: string
  ) {
    super(message)
    this.name = 'AiError'
  }
}

type Call = {
  prompt: PromptName
  variables: Record<string, string | number>
  tier: Tier
  /** Who the call is for and what it counts as, for the usage log. */
  run: { userId: string; operation: AiOperation; units?: number }
  /** Overridable for tests and evals. */
  targets?: Target[]
  record?: (run: AiRunRecord) => Promise<void>
}

function isInvalidOutput(error: unknown): boolean {
  return (
    NoObjectGeneratedError.isInstance(error) ||
    TypeValidationError.isInstance(error) ||
    JSONParseError.isInstance(error)
  )
}

function describe(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500)
}

/**
 * One structured call. The answer is validated against `schema`; a malformed answer is
 * sent back once with the validation error, and a provider failure moves to the next
 * provider. Throws AiError when nothing worked.
 */
export async function generate<Schema extends z.ZodType>(
  call: Call & { schema: Schema }
): Promise<z.infer<Schema>> {
  const { version, system, user } = renderPrompt(call.prompt, call.variables)
  const targets = call.targets ?? defaultTargets(call.tier)
  const record = call.record ?? recordAiRun
  const log = { ...call.run, promptVersion: version }

  let invalid = false
  for (const target of targets) {
    let feedback = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      const startedAt = Date.now()
      const attemptLog = { ...log, provider: target.provider, model: target.model }
      try {
        const result = await generateObject({
          model: target.languageModel,
          schema: call.schema,
          system,
          prompt: user + feedback,
          temperature: TEMPERATURE[call.tier],
          // Falling over to the next provider is our retry
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS[call.tier]),
          providerOptions: PROVIDER_OPTIONS,
        })
        await record({
          ...attemptLog,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          latencyMs: Date.now() - startedAt,
          success: true,
        })
        return result.object as z.infer<Schema>
      } catch (error) {
        await record({ ...attemptLog, latencyMs: Date.now() - startedAt, success: false, error: describe(error) })
        invalid = isInvalidOutput(error)
        if (!invalid) break // provider trouble: next provider
        feedback = `\n\nYour previous answer was rejected: ${describe(error)}\nReturn only JSON that matches the schema.`
      }
    }
    // A model that answered twice with the wrong shape is not an outage; stop here.
    if (invalid) break
  }

  throw invalid
    ? new AiError('invalid_output', 'The model returned an answer we could not use')
    : new AiError('unavailable', 'No AI provider is available right now')
}

/**
 * One structured call whose answer is shown while it is written. `partials` yields the
 * object as it fills in; `object` resolves to the validated whole, or rejects with an
 * AiError. Like `stream()`, it can switch model until the first content arrives.
 */
export async function generateStream<Schema extends z.ZodType>(
  call: Call & { schema: Schema }
): Promise<{ partials: AsyncIterable<unknown>; object: Promise<z.infer<Schema>> }> {
  const { version, system, user } = renderPrompt(call.prompt, call.variables)
  const targets = call.targets ?? defaultTargets(call.tier)
  const record = call.record ?? recordAiRun

  for (const target of targets) {
    const startedAt = Date.now()
    const log = { ...call.run, promptVersion: version, provider: target.provider, model: target.model }
    const failed = (error: unknown) =>
      record({ ...log, latencyMs: Date.now() - startedAt, success: false, error: describe(error) })

    const result = streamObject({
      model: target.languageModel,
      schema: call.schema,
      system,
      prompt: user,
      temperature: TEMPERATURE[call.tier],
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS[call.tier]),
      providerOptions: PROVIDER_OPTIONS,
      onError: () => {},
    })
    // Logged once, when the whole answer has been validated (or has failed to)
    const object = result.object.then(
      async (value) => {
        const usage = await result.usage
        await record({
          ...log,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs: Date.now() - startedAt,
          success: true,
        })
        return value as z.infer<Schema>
      },
      async (error) => {
        await failed(error)
        throw isInvalidOutput(error)
          ? new AiError('invalid_output', 'The model returned an answer we could not use')
          : new AiError('unavailable', 'The answer was cut off')
      }
    )
    // The caller may never await it (for example when this model is skipped below)
    object.catch(() => {})

    const parts = result.fullStream[Symbol.asyncIterator]()
    const nextPartial = async (): Promise<{ value: unknown } | null> => {
      for (;;) {
        const { value: part, done } = await parts.next()
        if (done) return null
        if (part.type === 'error') throw part.error
        if (part.type === 'object') return { value: part.object }
      }
    }

    let first: { value: unknown } | null
    try {
      first = await nextPartial()
    } catch {
      continue // `object` has logged the failure; try the next model
    }

    return {
      partials: (async function* () {
        try {
          for (let partial = first; partial !== null; partial = await nextPartial()) yield partial.value
        } catch {
          // The failure surfaces through `object`
        }
      })(),
      object,
    }
  }

  throw new AiError('unavailable', 'No AI provider is available right now')
}

/**
 * One streamed text call. Resolves once the first text has arrived, so a provider that
 * fails before saying anything can still be swapped for the next one.
 */
export async function stream(call: Call): Promise<AsyncIterable<string>> {
  const { version, system, user } = renderPrompt(call.prompt, call.variables)
  const targets = call.targets ?? defaultTargets(call.tier)
  const record = call.record ?? recordAiRun

  for (const target of targets) {
    const startedAt = Date.now()
    const log = { ...call.run, promptVersion: version, provider: target.provider, model: target.model }
    const result = streamText({
      model: target.languageModel,
      system,
      prompt: user,
      temperature: TEMPERATURE[call.tier],
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS[call.tier]),
      providerOptions: PROVIDER_OPTIONS,
      // Errors are handled below; without this the SDK prints them
      onError: () => {},
    })
    const parts = result.fullStream[Symbol.asyncIterator]()

    // Reads until the next piece of text. Null means the stream ended.
    const nextText = async (): Promise<string | null> => {
      for (;;) {
        const { value: part, done } = await parts.next()
        if (done) return null
        if (part.type === 'error') throw part.error
        if (part.type === 'text-delta' && part.text) return part.text
      }
    }

    let first: string | null
    try {
      first = await nextText()
    } catch (error) {
      await record({ ...log, latencyMs: Date.now() - startedAt, success: false, error: describe(error) })
      continue
    }

    return (async function* () {
      try {
        for (let text = first; text !== null; text = await nextText()) yield text
        const usage = await result.usage
        await record({
          ...log,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs: Date.now() - startedAt,
          success: true,
        })
      } catch (error) {
        // Too late to switch provider: the reader already has half an answer
        await record({ ...log, latencyMs: Date.now() - startedAt, success: false, error: describe(error) })
        throw new AiError('unavailable', 'The answer was cut off')
      }
    })()
  }

  throw new AiError('unavailable', 'No AI provider is available right now')
}

/** Collects a stream into one string, for callers that do not stream to the browser yet. */
export async function collect(text: AsyncIterable<string>): Promise<string> {
  let all = ''
  for await (const chunk of text) all += chunk
  return all
}

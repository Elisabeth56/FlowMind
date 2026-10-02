# 004 AI pipeline and providers

Status: accepted (2026-10-01)

## Context

Three AI features, each a single structured call today:

| Feature | Level on the escalation ladder | Model today |
|---|---|---|
| Organize one item | 1: one prompt, structured output | llama-3.1-8b-instant |
| Daily plan | 1: one prompt over pre-ranked candidates | llama-3.3-70b-versatile |
| Weekly summary | 1: one prompt around SQL-computed stats | llama-3.3-70b-versatile |

They run through LangChain (`ChatPromptTemplate → model → StructuredOutputParser`), which asks the model to write JSON from format instructions instead of using the provider's JSON schema mode. There is no timeout, no fallback, a per-instance rate limiter that does nothing on serverless, prompts live inside code strings, the weekly `focus_score` and trend are made up by the model, plan item ids from the model are trusted, and the README says "Mistral" though no Mistral model is called. No evals exist.

Free-tier notes (checked 2026-10-01; exact limits are per account, shown in each console):
- **Groq**: fast, free tier with per-model RPM/RPD/TPM/TPD limits; our current models are both served.
- **Gemini API free tier**: generous flash-class limits; free-tier content may be used by Google to improve products.
- **Mistral Experiment plan**: free, but requests on it may be used to train Mistral's models.
These are private notes, so the fallback's data terms matter as much as its limits.

## Options

**A. Keep LangChain, harden it.** Add timeouts, fallbacks (`withFallbacks`), structured output via `withStructuredOutput`.
- Saves: prompt templating and fallbacks out of the box.
- Costs: three layers of abstraction for three single calls, heavy dependency churn (two major versions in a year), harder stack traces, bundle weight in every route.

**B. Vercel AI SDK (`ai` v7 + `@ai-sdk/groq`, `@ai-sdk/google`).**
- Saves: zod-typed structured output with the provider's schema mode, streaming to React out of the box (`streamText`/partial objects), provider swap is one import, built for Next.js route handlers.
- Costs: one more dependency to learn; versions move fast too.

**C. Provider SDKs directly (`groq-sdk`, plus one fallback SDK) behind a ~100-line `lib/ai.ts`.**
- Saves: fewest dependencies, full control.
- Costs: we write streaming, schema-mode JSON parsing and the fallback loop ourselves, per provider.

Fallback provider (pick one):
1. **Second Groq model only** (70B → 8B). Simplest, same data terms, but no protection from a Groq outage.
2. **Gemini flash-class model.** Different infrastructure, generous free tier; disclose free-tier data use on the privacy page.
3. **Mistral small.** Matches the original "Groq + Mistral" story; Experiment plan may train on requests.

## Decision

Recommended: **B with fallback 2.** One `src/lib/ai.ts` exposing `generate()` (structured, zod) and `stream()`; Groq first, Gemini on 429/5xx/timeout, then a friendly error. Prompts move to `src/lib/ai/prompts/*.md` with a version string logged on every run. Every call: timeout, `ai_runs` row with tokens, latency, provider, prompt version. Numbers (focus score, trend, counts) are computed in SQL and passed in. Model output ids are checked against the candidate set; one retry with the validation error, then fail cleanly. Remove LangChain and `groq-sdk`. Replace "Groq + Mistral" in copy with what actually runs.

Evals ship with the remodel: `evals/organize.jsonl` (~40 cases), `evals/daily-plan.jsonl` (~15 cases, checks id validity, ordering by due date and priority, total minutes), run with `npm run eval`, results saved to `evals/results/`.

## Consequences

- Smaller bundles and simpler code: each feature is one function with a prompt file and a schema.
- Streaming the daily plan makes the slowest feature feel fast.
- Gemini fallback means some notes may reach Google on its free tier when Groq is down; disclosed, and switchable to option 1 by changing one list.

## Revisit when

A feature needs tools or multi-step reasoning the eval shows one call can't do, or a free tier's terms change.

## Update 2026-10-02

Built in #20. Two things differ from the text above:

- **Models.** Groq retired `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` from the free tier on 2026-08-16, so every AI call in the deployed app had been failing since then. The module uses Groq's recommended replacements, `openai/gpt-oss-20b` and `openai/gpt-oss-120b`, with `gemini-3.5-flash-lite` and `gemini-3.8-flash` as the fallback.
- **Fallback trigger.** Any provider error moves to the next provider, not only 429, 5xx and timeouts: a revoked key or a retired model should not take the feature down while a second provider is configured. Every failed attempt is logged in `ai_runs`. A malformed answer is the exception: it is retried once on the same provider and then fails.

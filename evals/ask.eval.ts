// npm run eval:ask
//
// Measures retrieval for Ask your notes on the seeded demo account: for each question
// in evals/ask.jsonl, is the note that answers it in the top 8 (recall@8), and how near
// the top (MRR)? Runs hybrid search beside each half alone, and checks that questions
// with no answer in the notes are recognised before a model is asked.
//
// Needs a local Supabase with the seed and the embed function running:
//   supabase start && supabase functions serve
//   eval "$(supabase status -o env)" && SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY \
//     SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY npm run eval:ask
// No model is called. Saves evals/results/ask-<timestamp>.json; the committed
// reference run is evals/results/ask-baseline.json.
import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { expect, it } from 'vitest'
import { MIN_SIMILARITY, foundSomething, type Match } from '@/lib/ask'
import { mean, percentile, recallAtK, reciprocalRank } from './score'

const DEMO_USER = '0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6'
const DEMO_EMAIL = 'demo@elisabethnnamani.dev'
const K = 8

type Case = { question: string; expect: string[] }

it('ask: retrieval', async () => {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env
  if (!url || !anonKey || !serviceKey) throw new Error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY')
  if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error('This eval resets the demo password: run it against a local Supabase only')

  // Sign in as the demo user with a throwaway password, so everything below runs under RLS
  const password = randomBytes(18).toString('base64url')
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { error: resetError } = await admin.auth.admin.updateUserById(DEMO_USER, { password })
  if (resetError) throw new Error(`Could not prepare the demo user: ${resetError.message}`)
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password })
  if (signInError) throw new Error(`Could not sign in: ${signInError.message}`)

  // Embed every item, a batch at a time, as the Ask screen does on opening
  let embeddedItems = 0
  for (let batch = 0; batch < 40; batch++) {
    const { data, error } = await supabase.functions.invoke('embed', { body: {} })
    if (error) throw new Error(`The embed function failed: ${error.message}`)
    embeddedItems += data.embedded
    if (!data.remaining) break
  }
  const { data: items } = await supabase.from('inbox_items').select('id, content')
  console.log(`embedded ${embeddedItems} of ${items?.length} items`)

  const cases: Case[] = readFileSync(path.join(process.cwd(), 'evals', 'ask.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  const search = async (query: string, embedding: number[] | null): Promise<Match[]> => {
    const { data, error } = await supabase.rpc('match_items', {
      p_query: query,
      p_embedding: embedding ? JSON.stringify(embedding) : undefined,
      p_limit: K,
    })
    if (error) throw new Error(`match_items failed: ${error.message}`)
    return data as Match[]
  }

  const results = []
  for (const c of cases) {
    const expected = c.expect.map((snippet) => {
      const item = items?.find((i) => i.content.includes(snippet))
      if (!item) throw new Error(`No seeded item contains "${snippet}"`)
      return item.id
    })

    const startedAt = Date.now()
    const { data: embedded, error } = await supabase.functions.invoke('embed', { body: { query: c.question } })
    if (error) throw new Error(`Could not embed the question: ${error.message}`)
    const hybrid = await search(c.question, embedded.embedding)
    const latencyMs = Date.now() - startedAt
    const keyword = await search(c.question, null)
    const semantic = await search('', embedded.embedding)

    const ids = (matches: Match[]) => matches.map((match) => match.id)
    const result = {
      question: c.question,
      answerable: expected.length > 0,
      recall: { hybrid: recallAtK(ids(hybrid), expected, K), keyword: recallAtK(ids(keyword), expected, K), semantic: recallAtK(ids(semantic), expected, K) },
      rr: { hybrid: reciprocalRank(ids(hybrid), expected), keyword: reciprocalRank(ids(keyword), expected), semantic: reciprocalRank(ids(semantic), expected) },
      // what the route's "nothing found" check sees
      found: foundSomething(hybrid),
      top_similarity: Math.max(0, ...semantic.map((match) => match.similarity ?? 0)),
      keyword_hits: keyword.length,
      top: hybrid[0]?.content ?? null,
      latencyMs,
    }
    results.push(result)
    const ok = result.answerable ? result.recall.hybrid === 1 : !result.found
    console.log(`${ok ? 'pass' : 'FAIL'}  ${c.question}  sim=${result.top_similarity.toFixed(3)} kw=${result.keyword_hits}`)
  }

  const answerable = results.filter((r) => r.answerable)
  const unanswerable = results.filter((r) => !r.answerable)
  const modes = ['hybrid', 'keyword', 'semantic'] as const
  const summary = {
    items: items?.length,
    questions: { answerable: answerable.length, unanswerable: unanswerable.length },
    recall_at_8: Object.fromEntries(modes.map((mode) => [mode, mean(answerable.map((r) => r.recall[mode]))])),
    mrr: Object.fromEntries(modes.map((mode) => [mode, mean(answerable.map((r) => r.rr[mode]))])),
    // Unanswerable questions stopped before any model call, and answerable ones wrongly stopped
    not_found_without_a_model: mean(unanswerable.map((r) => (r.found ? 0 : 1))),
    answerable_wrongly_stopped: mean(answerable.map((r) => (r.found ? 0 : 1))),
    min_similarity: MIN_SIMILARITY,
    top_similarity: {
      answerable: { min: Math.min(...answerable.map((r) => r.top_similarity)), p50: percentile(answerable.map((r) => r.top_similarity), 50) },
      unanswerable: { p50: percentile(unanswerable.map((r) => r.top_similarity), 50), max: Math.max(...unanswerable.map((r) => r.top_similarity)) },
    },
    search_latency_ms: { p50: percentile(results.map((r) => r.latencyMs), 50), p95: percentile(results.map((r) => r.latencyMs), 95) },
  }
  console.log(JSON.stringify(summary, null, 2))

  const out = path.join(process.cwd(), 'evals', 'results')
  mkdirSync(out, { recursive: true })
  const file = path.join(out, `ask-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify({ summary, results }, null, 2))
  console.log(`saved ${path.relative(process.cwd(), file)}`)

  expect(results.length).toBe(cases.length)
})

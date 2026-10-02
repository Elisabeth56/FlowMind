// npm run eval
//
// Runs the organize and daily-plan cases against the real models, prints a table and
// saves evals/results/<timestamp>.json. Compare against evals/results/baseline.json;
// when a run is better and you want to keep it, copy it over the baseline and commit.
//
// Needs GROQ_API_KEY. Calls are spaced out to stay inside the free tier's per-minute limit.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, it } from 'vitest'
import { defaultTargets } from '@/lib/ai'
import { organizeItem } from '@/lib/ai/organize'
import { planDay } from '@/lib/ai/plan-day'
import type { AiRunRecord } from '@/lib/billing/quota'
import { addDays } from '@/lib/dates'
import { accuracy, percentile, scoreOrganize, scorePlan, type OrganizeExpectation, type PlanExpectation } from './score'

// Thursday. Fixed so "before Friday" always means the same date.
const TODAY = '2026-10-01'
const NOW = new Date('2026-10-01T07:00:00Z') // 08:00 in Lagos
const PROJECTS = ['Clients', 'Pitch prep', 'Home', 'Reading']
const PAUSE_MS = Number(process.env.EVAL_PAUSE_MS ?? 2200)

const dir = path.join(process.cwd(), 'evals')
const readCases = <T>(file: string): T[] =>
  readFileSync(path.join(dir, file), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS))

type CaseResult = { name: string; checks: Record<string, boolean>; error?: string; latencyMs: number; tokens: number }

/** Runs one case, collecting what the AI module would have written to ai_runs. */
async function measure(name: string, run: (record: (r: AiRunRecord) => Promise<void>) => Promise<Record<string, boolean>>) {
  const runs: AiRunRecord[] = []
  const startedAt = Date.now()
  let checks: Record<string, boolean> = {}
  let error: string | undefined
  try {
    checks = await run(async (r) => void runs.push(r))
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
    checks = { answered: false }
  }
  const result: CaseResult = {
    name,
    checks,
    error,
    latencyMs: Date.now() - startedAt,
    tokens: runs.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0),
  }
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([check]) => check)
  console.log(`${failed.length === 0 ? 'pass' : 'FAIL'}  ${name}${failed.length ? `  [${failed.join(', ')}]` : ''}`)
  return result
}

function summarize(results: CaseResult[]) {
  const latencies = results.map((r) => r.latencyMs)
  return {
    cases: results.length,
    accuracy: accuracy(results.map((r) => r.checks)),
    latency_ms: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    tokens_per_case: Math.round(results.reduce((sum, r) => sum + r.tokens, 0) / results.length),
  }
}

it('evals', async () => {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Set GROQ_API_KEY to run the evals')
  const keys = { GROQ_API_KEY: key, GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY }

  console.log('\norganize')
  const organize: CaseResult[] = []
  for (const c of readCases<{ input: string; expect: OrganizeExpectation }>('organize.jsonl')) {
    organize.push(
      await measure(c.input.slice(0, 60), async (record) =>
        scoreOrganize(
          await organizeItem(
            c.input,
            { userId: 'eval', existingProjects: PROJECTS, today: TODAY },
            { targets: defaultTargets('fast', keys), record }
          ),
          c.expect
        )
      )
    )
    await pause()
  }

  console.log('\ndaily plan')
  type PlanCase = {
    name: string
    items: { id: string; content: string; priority: number; due: number | null; project: string | null }[]
    expect: PlanExpectation
  }
  const plan: CaseResult[] = []
  for (const c of readCases<PlanCase>('daily-plan.jsonl')) {
    const items = c.items.map((item) => ({
      id: item.id,
      content: item.content,
      priority: item.priority,
      due_date: item.due === null ? null : addDays(TODAY, item.due),
      project_name: item.project,
    }))
    plan.push(
      await measure(c.name, async (record) =>
        scorePlan(
          await planDay(
            { userId: 'eval', items, projects: PROJECTS, timeZone: 'Africa/Lagos', preferredStart: '08:30', completedToday: 0, now: NOW },
            { targets: defaultTargets('smart', keys), record }
          ),
          items.map((item) => item.id),
          c.expect
        )
      )
    )
    await pause()
  }

  const report = {
    ran_at: new Date().toISOString(),
    organize: summarize(organize),
    daily_plan: summarize(plan),
    failures: [...organize, ...plan]
      .filter((r) => Object.values(r.checks).includes(false))
      .map((r) => ({ name: r.name, failed: Object.keys(r.checks).filter((k) => !r.checks[k]), error: r.error })),
  }

  mkdirSync(path.join(dir, 'results'), { recursive: true })
  const file = path.join(dir, 'results', `${report.ran_at.replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`)

  let baseline: typeof report | null = null
  try {
    baseline = JSON.parse(readFileSync(path.join(dir, 'results', 'baseline.json'), 'utf8'))
  } catch {
    // first run: nothing to compare with
  }

  for (const name of ['organize', 'daily_plan'] as const) {
    console.log(`\n${name}: ${report[name].cases} cases`)
    console.table(
      Object.fromEntries(
        Object.entries(report[name].accuracy).map(([check, value]) => [
          check,
          { 'accuracy %': value, 'baseline %': baseline?.[name].accuracy[check] ?? '-' },
        ])
      )
    )
    console.log(
      `latency p50 ${report[name].latency_ms.p50}ms, p95 ${report[name].latency_ms.p95}ms; ${report[name].tokens_per_case} tokens per case`
    )
  }
  console.log(`\nSaved ${path.relative(process.cwd(), file)}`)

  // The one hard requirement: a plan never names an item it was not given
  expect(report.daily_plan.accuracy.valid_ids).toBe(100)
})

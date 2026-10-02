import { describe, expect, it } from 'vitest'
import { APICallError } from 'ai'
import { MockLanguageModelV4, simulateReadableStream } from 'ai/test'
import { z } from 'zod'
import type { AiRunRecord } from '@/lib/billing/quota'
import { AiError, collect, generate, stream, type Target } from './index'
import { fill, parsePrompt } from './prompt'

const usage = {
  inputTokens: { total: 120, noCache: 120, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 30, text: 30, reasoning: undefined },
}
const finishReason = { unified: 'stop' as const, raw: undefined }

const answers = (...texts: string[]) => {
  let call = 0
  return async () => ({
    content: [{ type: 'text' as const, text: texts[Math.min(call++, texts.length - 1)] }],
    finishReason,
    usage,
    warnings: [],
  })
}
const failing = (statusCode: number) => async () => {
  throw new APICallError({
    message: `status ${statusCode}`,
    url: 'https://provider.test',
    requestBodyValues: {},
    statusCode,
  })
}

function target(provider: string, doGenerate: unknown, doStream?: unknown): Target & { mock: MockLanguageModelV4 } {
  const mock = new MockLanguageModelV4({ provider, modelId: `${provider}-model`, doGenerate, doStream } as never)
  return { provider, model: `${provider}-model`, languageModel: mock, mock }
}

const schema = z.object({ answer: z.string() })
const variables = { today: '2026-10-02', plan_summary: 'Deck at 9', question: 'What first?' }

function setup() {
  const runs: AiRunRecord[] = []
  const base = {
    prompt: 'ask' as const,
    variables,
    tier: 'fast' as const,
    run: { userId: 'user-1', operation: 'ask' as const },
    record: async (run: AiRunRecord) => {
      runs.push(run)
    },
  }
  return { runs, base }
}

describe('generate', () => {
  it('returns the validated object and logs the run', async () => {
    const { runs, base } = setup()
    const groq = target('groq', answers('{"answer":"The deck"}'))

    expect(await generate({ ...base, schema, targets: [groq] })).toEqual({ answer: 'The deck' })
    expect(runs).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        operation: 'ask',
        provider: 'groq',
        model: 'groq-model',
        promptVersion: 'ask-2',
        inputTokens: 120,
        outputTokens: 30,
        success: true,
      }),
    ])
  })

  it.each([429, 503])('completes through the second provider when the first answers %i', async (status) => {
    const { runs, base } = setup()
    const groq = target('groq', failing(status))
    const gemini = target('google', answers('{"answer":"From Gemini"}'))

    expect(await generate({ ...base, schema, targets: [groq, gemini] })).toEqual({ answer: 'From Gemini' })
    expect(runs.map((run) => [run.provider, run.success])).toEqual([
      ['groq', false],
      ['google', true],
    ])
  })

  it('sends a malformed answer back once with the validation error', async () => {
    const { runs, base } = setup()
    const groq = target('groq', answers('{"wrong":1}', '{"answer":"Second try"}'))

    expect(await generate({ ...base, schema, targets: [groq] })).toEqual({ answer: 'Second try' })
    expect(groq.mock.doGenerateCalls).toHaveLength(2)
    expect(JSON.stringify(groq.mock.doGenerateCalls[1].prompt)).toContain('previous answer was rejected')
    expect(runs.map((run) => run.success)).toEqual([false, true])
  })

  it('fails cleanly when the answer is malformed twice, without trying another provider', async () => {
    const { base } = setup()
    const groq = target('groq', answers('not json'))
    const gemini = target('google', answers('{"answer":"unused"}'))

    await expect(generate({ ...base, schema, targets: [groq, gemini] })).rejects.toMatchObject({
      name: 'AiError',
      kind: 'invalid_output',
    })
    expect(groq.mock.doGenerateCalls).toHaveLength(2)
    expect(gemini.mock.doGenerateCalls).toHaveLength(0)
  })

  it('reports unavailable when every provider is down', async () => {
    const { base } = setup()
    const error = await generate({
      ...base,
      schema,
      targets: [target('groq', failing(500)), target('google', failing(500))],
    }).catch((e) => e)
    expect(error).toBeInstanceOf(AiError)
    expect(error.kind).toBe('unavailable')
  })
})

describe('stream', () => {
  const chunks = (...texts: string[]) => async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-start' as const, id: '1' },
        ...texts.map((delta) => ({ type: 'text-delta' as const, id: '1', delta })),
        { type: 'text-end' as const, id: '1' },
        { type: 'finish' as const, finishReason, usage },
      ],
    }),
  })

  it('yields the text as it arrives and logs the run when it ends', async () => {
    const { runs, base } = setup()
    const text = await stream({ ...base, targets: [target('groq', undefined, chunks('Start ', 'with the deck.'))] })

    expect(await collect(text)).toBe('Start with the deck.')
    expect(runs).toEqual([expect.objectContaining({ provider: 'groq', success: true, outputTokens: 30 })])
  })

  it('switches provider when the first fails before saying anything', async () => {
    const { runs, base } = setup()
    const text = await stream({
      ...base,
      targets: [target('groq', undefined, failing(429)), target('google', undefined, chunks('From Gemini'))],
    })

    expect(await collect(text)).toBe('From Gemini')
    expect(runs.map((run) => [run.provider, run.success])).toEqual([
      ['groq', false],
      ['google', true],
    ])
  })
})

describe('prompt files', () => {
  it('reads the version and both parts', () => {
    expect(parsePrompt('---\nversion: demo-1\n---\n## system\nBe brief.\n\n## user\nHello {{name}}\n')).toEqual({
      version: 'demo-1',
      system: 'Be brief.',
      user: 'Hello {{name}}',
    })
  })

  it('refuses to render with a variable missing', () => {
    expect(fill('Hello {{name}}', { name: 'Tolu' })).toBe('Hello Tolu')
    expect(() => fill('Hello {{name}}', {})).toThrow('"name" was not provided')
  })
})

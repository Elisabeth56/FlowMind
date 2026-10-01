import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseEnv } from './env'

const schema = z.object({ A: z.string().min(1), B: z.url() })

describe('parseEnv', () => {
  it('returns the values when everything is set', () => {
    expect(parseEnv(schema, { A: 'x', B: 'https://flowmind.app' })).toEqual({ A: 'x', B: 'https://flowmind.app' })
  })

  it('names every missing or invalid variable in one message', () => {
    expect(() => parseEnv(schema, { B: 'not a url' })).toThrow('Missing or invalid environment variables: A, B')
  })
})

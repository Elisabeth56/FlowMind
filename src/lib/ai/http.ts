import { NextResponse } from 'next/server'
import { AiError } from './index'

/** The response for a failed model call, or null when the error is something else. */
export function aiErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AiError)) return null
  return error.kind === 'unavailable'
    ? NextResponse.json({ error: 'The AI is busy right now. Try again in a minute.' }, { status: 503 })
    : NextResponse.json({ error: 'The AI gave an answer we could not use. Try again.' }, { status: 502 })
}

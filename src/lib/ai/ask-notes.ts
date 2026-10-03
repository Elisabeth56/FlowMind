// Ask your notes: one structured call over the retrieved items. Retrieval decides what
// the model sees (match_items); this only writes the answer and says whether it found one.
import { z } from 'zod'
import { citedNumbers, dropUnknownCitations, type Match } from '@/lib/ask'
import { generate, type CallOverrides } from './index'

const answerSchema = z.object({
  found: z.boolean(),
  answer: z.string(),
})

export type NotesAnswer = {
  found: boolean
  answer: string
  /** Source numbers the answer cites, 1-based, in order of first use */
  cited: number[]
}

function describeSource(match: Match, n: number, timeZone: string): string {
  const saved = new Date(match.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone })
  const details = [match.item_type, match.project_name, `saved ${saved}`, match.status === 'completed' ? 'done' : null]
  return `[${n}] (${details.filter(Boolean).join(', ')}) ${match.content}`
}

export async function answerFromNotes(
  input: { userId: string; question: string; matches: Match[]; today: string; timeZone: string },
  overrides: CallOverrides = {}
): Promise<NotesAnswer> {
  const written = await generate({
    prompt: 'ask-notes',
    tier: 'smart',
    schema: answerSchema,
    variables: {
      today: input.today,
      question: input.question,
      sources: input.matches.map((match, i) => describeSource(match, i + 1, input.timeZone)).join('\n'),
    },
    run: { userId: input.userId, operation: 'ask' },
    ...overrides,
  })

  // The model may only cite what it was given
  const answer = dropUnknownCitations(written.answer, input.matches.length)
  const cited = citedNumbers(answer, input.matches.length)
  // An answer that claims to be found but cites nothing is not grounded in the notes
  return { found: written.found && cited.length > 0, answer, cited }
}

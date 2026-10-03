// The parts of Ask your notes that are plain logic: deciding whether retrieval found
// anything worth sending to the model, and checking the citations in what came back.

export type Match = {
  id: string
  content: string
  item_type: string
  status: string
  project_name: string | null
  created_at: string
  /** Cosine similarity to the question, null when found by keywords only */
  similarity: number | null
  /** Full-text rank, null when found by meaning only */
  keyword_rank: number | null
  score: number
}

// gte-small scores unrelated short texts around 0.75 to 0.80; below this the nearest
// note is about something else. Set from the retrieval eval (evals/results/ask-baseline.json).
export const MIN_SIMILARITY = 0.8

/** True when at least one match shares a word with the question or is close in meaning. */
export function foundSomething(matches: Match[]): boolean {
  return matches.some((match) => match.keyword_rank !== null || (match.similarity ?? 0) >= MIN_SIMILARITY)
}

const CITATION = /\[(\d+)\]/g

/** The source numbers an answer cites, in order of first use, ignoring numbers that are not sources. */
export function citedNumbers(answer: string, sourceCount: number): number[] {
  const cited: number[] = []
  for (const [, digits] of answer.matchAll(CITATION)) {
    const n = Number(digits)
    if (n >= 1 && n <= sourceCount && !cited.includes(n)) cited.push(n)
  }
  return cited
}

/** Removes citation markers that point at no source, so the UI never shows a dead link. */
export function dropUnknownCitations(answer: string, sourceCount: number): string {
  return answer
    .replace(CITATION, (marker, digits) => (Number(digits) >= 1 && Number(digits) <= sourceCount ? marker : ''))
    .replace(/ +([.,;:])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export type AnswerPart = { text: string } | { cite: number }

/** Splits an answer into text and citation markers, for rendering the markers as links. */
export function answerParts(answer: string): AnswerPart[] {
  const parts: AnswerPart[] = []
  let last = 0
  for (const match of answer.matchAll(CITATION)) {
    if (match.index > last) parts.push({ text: answer.slice(last, match.index) })
    parts.push({ cite: Number(match[1]) })
    last = match.index + match[0].length
  }
  if (last < answer.length) parts.push({ text: answer.slice(last) })
  return parts
}

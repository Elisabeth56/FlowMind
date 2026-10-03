import { describe, expect, it } from 'vitest'
import { MIN_SIMILARITY, answerParts, citedNumbers, dropUnknownCitations, foundSomething, type Match } from './ask'

const match = (over: Partial<Match>): Match => ({
  id: 'a', content: 'x', item_type: 'note', status: 'organized', project_name: null, created_at: '2026-10-01T00:00:00Z',
  similarity: null, keyword_rank: null, score: 0.01, ...over,
})

describe('foundSomething', () => {
  it('is false with no matches', () => {
    expect(foundSomething([])).toBe(false)
  })
  it('is false when the nearest note is still far from the question', () => {
    expect(foundSomething([match({ similarity: MIN_SIMILARITY - 0.05 })])).toBe(false)
  })
  it('is true when a note is close in meaning', () => {
    expect(foundSomething([match({ similarity: MIN_SIMILARITY + 0.05 })])).toBe(true)
  })
  it('is true when a note shares a word with the question, however far in meaning', () => {
    expect(foundSomething([match({ similarity: 0.5, keyword_rank: 0.06 })])).toBe(true)
  })
})

describe('citedNumbers', () => {
  it('lists each cited source once, in order of first use', () => {
    expect(citedNumbers('Move pricing [2], add a quote [2]. Due Thursday [1].', 3)).toEqual([2, 1])
  })
  it('ignores numbers that are not sources', () => {
    expect(citedNumbers('Done [4] and [0] and [1].', 2)).toEqual([1])
  })
})

describe('dropUnknownCitations', () => {
  it('removes markers that point at no source and tidies the gap', () => {
    expect(dropUnknownCitations('Pricing first [1], then team [7].', 2)).toBe('Pricing first [1], then team.')
  })
  it('leaves a clean answer alone', () => {
    expect(dropUnknownCitations('Thursday morning [2].', 2)).toBe('Thursday morning [2].')
  })
})

describe('answerParts', () => {
  it('splits text and markers', () => {
    expect(answerParts('Pricing first [1], by Thursday [2].')).toEqual([
      { text: 'Pricing first ' }, { cite: 1 }, { text: ', by Thursday ' }, { cite: 2 }, { text: '.' },
    ])
  })
  it('returns one part for an answer with no citations', () => {
    expect(answerParts('Nothing found.')).toEqual([{ text: 'Nothing found.' }])
  })
})

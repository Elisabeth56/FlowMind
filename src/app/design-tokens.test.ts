// Every text and background pairing the design system allows must pass WCAG AA
// (4.5:1) in both themes. Read from the stylesheet itself, so the test cannot drift
// from what ships.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...block.matchAll(/--fm-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// [text, background]
const PAIRS: [string, string][] = [
  ...['ink', 'ink-2', 'ink-3', 'accent', 'success', 'warning', 'danger'].flatMap(
    (text) => [[text, 'bg'], [text, 'surface']] as [string, string][]
  ),
  ['ink', 'surface-sunk'],
  ['ink-2', 'surface-sunk'],
  ['on-accent', 'accent'],
  ['accent-tint-ink', 'accent-tint'],
  ['apricot-ink', 'apricot-tint'],
  ['sage-ink', 'sage-tint'],
  ['plum-ink', 'plum-tint'],
  ['danger', 'danger-tint'],
  // a due state recolours the text of a neutral chip
  ['warning', 'surface-sunk'],
  ['danger', 'surface-sunk'],
]

describe.each([
  ['light', ':root'],
  ['dark', '[data-theme="dark"]'],
])('%s theme', (_, selector) => {
  const theme = tokens(selector)

  it('defines every colour token', () => {
    expect(Object.keys(theme)).toHaveLength(25)
  })

  it.each(PAIRS)('%s on %s passes AA', (text, background) => {
    expect(contrast(theme[text], theme[background])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('apricot', () => {
  it('carries ink text, since it is too light for paper text', () => {
    expect(contrast(tokens(':root').ink, tokens(':root').apricot)).toBeGreaterThanOrEqual(4.5)
  })
})

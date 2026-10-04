import { describe, expect, it } from 'vitest'
import { resolveTheme } from './theme'

describe('resolveTheme', () => {
  it('uses an explicit choice whatever the device says', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
  it('follows the device on "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
  it('treats a missing or unknown choice as "system"', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme('neon', false)).toBe('light')
  })
})

import { describe, expect, it } from 'vitest'
import { authErrorMessage, safeNext } from './auth'

describe('safeNext', () => {
  it('keeps a path inside the app', () => {
    expect(safeNext('/dash/today')).toBe('/dash/today')
    expect(safeNext('/reset-password')).toBe('/reset-password')
  })

  it('falls back for anything that could leave the app', () => {
    for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', 'dash', '', null, undefined]) {
      expect(safeNext(next)).toBe('/dash')
    }
  })
})

describe('authErrorMessage', () => {
  it('explains a wrong password without saying which half was wrong', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'That email and password do not match. Check them and try again.'
    )
  })

  it('never shows an error it does not know in raw form', () => {
    expect(authErrorMessage({ code: 'unexpected_failure', message: 'pq: relation "x" does not exist' })).toBe(
      'Something went wrong on our side. Try again in a moment.'
    )
    expect(authErrorMessage(null)).toBe('Something went wrong on our side. Try again in a moment.')
  })
})

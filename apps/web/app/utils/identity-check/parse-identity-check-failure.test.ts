import { describe, expect, test } from 'vitest'

import { parseIdentityCheckFailure } from './parse-identity-check-failure'

describe('parseIdentityCheckFailure', () => {
  test('reads both failures', () => {
    expect(parseIdentityCheckFailure('google-account')).toBe('google-account')
    expect(parseIdentityCheckFailure('google-failed')).toBe('google-failed')
  })

  test('ignores a missing or unknown value', () => {
    expect(parseIdentityCheckFailure(null)).toBeNull()
    expect(parseIdentityCheckFailure('passkey-failed')).toBeNull()
  })
})

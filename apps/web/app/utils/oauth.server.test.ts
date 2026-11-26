import { createHash } from 'node:crypto'

import { describe, expect, test } from 'vitest'

import { createOAuthRequestParams, safeCompare } from '~/utils/oauth.server'

describe('safeCompare', () => {
  test('true for equal strings', () => {
    expect(safeCompare('abc123', 'abc123')).toBe(true)
  })

  test('false for different strings of equal length', () => {
    expect(safeCompare('abcdef', 'abcxyz')).toBe(false)
  })

  test('false for a length mismatch', () => {
    expect(safeCompare('abc', 'abcd')).toBe(false)
  })

  test('false for non-string inputs', () => {
    expect(safeCompare(undefined, 'x')).toBe(false)
    expect(safeCompare('x', undefined)).toBe(false)
    expect(safeCompare(null, null)).toBe(false)
    expect(safeCompare(123, 123)).toBe(false)
  })
})

describe('createOAuthRequestParams', () => {
  test('derives the PKCE S256 challenge from the verifier', () => {
    const { codeVerifier, codeChallenge } = createOAuthRequestParams()
    const expected = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    expect(codeChallenge).toBe(expected)
  })

  test('returns non-empty state, nonce, and verifier', () => {
    const { state, nonce, codeVerifier } = createOAuthRequestParams()

    for (const value of [state, nonce, codeVerifier]) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  test('generates fresh values on each call', () => {
    const first = createOAuthRequestParams()
    const second = createOAuthRequestParams()

    expect(first.state).not.toBe(second.state)
    expect(first.nonce).not.toBe(second.nonce)
    expect(first.codeVerifier).not.toBe(second.codeVerifier)
  })
})

import { describe, expect, test } from 'vitest'

import { getErrorMessage } from '~/utils/get-error-message'

describe('getErrorMessage', () => {
  test('returns a thrown string as is', () => {
    expect(getErrorMessage('boom')).toBe('boom')
  })

  test('returns the message of an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  test('returns the message of an error-like object', () => {
    expect(getErrorMessage({ message: 'boom' })).toBe('boom')
  })

  test('falls back when the message is not a string', () => {
    expect(getErrorMessage({ message: 42 })).toBe('Unknown error')
  })

  test.each([null, undefined, 42, {}])('falls back for %s', (value) => {
    expect(getErrorMessage(value)).toBe('Unknown error')
  })
})

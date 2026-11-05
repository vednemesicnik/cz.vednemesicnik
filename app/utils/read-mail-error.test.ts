import { describe, expect, test } from 'vitest'

import { readMailError } from './read-mail-error'

describe('readMailError', () => {
  test('reads the new name', () => {
    expect(readMailError({ mailError: 'unreachable' })).toBe('unreachable')
  })

  test('reads the old name from a script not yet released', () => {
    expect(readMailError({ mailerError: 'unreachable' })).toBe('unreachable')
  })

  test('holds nothing when the answer names no reason', () => {
    expect(readMailError({})).toBeUndefined()
    expect(readMailError(undefined)).toBeUndefined()
  })

  test('ignores a reason that is not text', () => {
    expect(readMailError({ mailError: 42 })).toBeUndefined()
  })
})

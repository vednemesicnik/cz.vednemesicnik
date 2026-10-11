import { describe, expect, test } from 'vitest'

import { getRegistrationProblem } from './get-registration-problem'

const createError = (name: string) => {
  const error = new Error('prompt failed')
  error.name = name
  return error
}

describe('getRegistrationProblem', () => {
  test('shows nothing for a closed or timed-out prompt', () => {
    expect(getRegistrationProblem(createError('NotAllowedError'))).toBeNull()
  })

  test('recognizes an authenticator that already holds a passkey', () => {
    expect(getRegistrationProblem(createError('InvalidStateError'))).toBe(
      'already-registered',
    )
  })

  test('treats any other error as a failure', () => {
    expect(getRegistrationProblem(createError('SecurityError'))).toBe('failed')
  })

  test('treats a non-error throw as a failure', () => {
    expect(getRegistrationProblem('unexpected')).toBe('failed')
  })
})

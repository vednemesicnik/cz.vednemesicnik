import { describe, expect, test } from 'vitest'

import { isPromptDismissed } from './is-prompt-dismissed'

const createError = (name: string) => {
  const error = new Error('prompt failed')
  error.name = name
  return error
}

describe('isPromptDismissed', () => {
  test('recognizes a closed or timed-out prompt', () => {
    expect(isPromptDismissed(createError('NotAllowedError'))).toBe(true)
  })

  test('treats any other error as a failure', () => {
    expect(isPromptDismissed(createError('SecurityError'))).toBe(false)
  })

  test('treats a non-error throw as a failure', () => {
    expect(isPromptDismissed('unexpected')).toBe(false)
  })
})

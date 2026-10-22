import { describe, expect, test } from 'vitest'

import { hasEmailChanged } from './has-email-changed'

const storedEmail = 'jakub.novak@vednemesicnik.cz'

describe('hasEmailChanged', () => {
  test('is false for the stored address', () => {
    expect(hasEmailChanged(storedEmail, storedEmail)).toBe(false)
  })

  test('ignores case and surrounding spaces', () => {
    expect(hasEmailChanged(storedEmail, ' Jakub.Novak@Vednemesicnik.CZ ')).toBe(
      false,
    )
  })

  test('is true for another address', () => {
    expect(hasEmailChanged(storedEmail, 'jakub@vednemesicnik.cz')).toBe(true)
  })

  test('is false for an empty field', () => {
    expect(hasEmailChanged(storedEmail, undefined)).toBe(false)
    expect(hasEmailChanged(storedEmail, '  ')).toBe(false)
  })
})

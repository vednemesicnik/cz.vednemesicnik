import { describe, expect, test } from 'vitest'

import { isLockedBySubmission } from './is-locked-by-submission'

const submittedAt = new Date('2026-09-25T10:00:00Z')

describe('isLockedBySubmission', () => {
  test('a submitted article is locked for a Creator and a Contributor', () => {
    expect(isLockedBySubmission({ roleLevel: 2, submittedAt })).toBe(true)
    expect(isLockedBySubmission({ roleLevel: 3, submittedAt })).toBe(true)
  })

  test('the Coordinator may still correct it', () => {
    expect(isLockedBySubmission({ roleLevel: 1, submittedAt })).toBe(false)
  })

  test('an unsubmitted article is not locked', () => {
    expect(isLockedBySubmission({ roleLevel: 3, submittedAt: null })).toBe(
      false,
    )
  })
})

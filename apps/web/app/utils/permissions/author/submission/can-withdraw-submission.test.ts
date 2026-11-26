import { describe, expect, test } from 'vitest'

import { canWithdrawSubmission } from './can-withdraw-submission'

const submitted = {
  authorId: 'author-1',
  authorIds: ['author-1', 'author-2'],
  state: 'draft' as const,
  submittedAt: new Date('2026-09-25T10:00:00Z'),
}

describe('canWithdrawSubmission', () => {
  test('any author may take a submitted draft back', () => {
    expect(canWithdrawSubmission(submitted)).toBe(true)
    expect(canWithdrawSubmission({ ...submitted, authorId: 'author-2' })).toBe(
      true,
    )
  })

  test('someone who is not an author may not', () => {
    expect(
      canWithdrawSubmission({ ...submitted, authorId: 'coordinator' }),
    ).toBe(false)
  })

  test('an unsubmitted draft has nothing to take back', () => {
    expect(canWithdrawSubmission({ ...submitted, submittedAt: null })).toBe(
      false,
    )
  })

  test('only a draft can be taken back', () => {
    expect(canWithdrawSubmission({ ...submitted, state: 'published' })).toBe(
      false,
    )
  })
})

import { describe, expect, test } from 'vitest'

import { canReturnForEdits } from './can-return-for-edits'

const submitted = {
  roleLevel: 1,
  state: 'draft' as const,
  submittedAt: new Date('2026-09-25T10:00:00Z'),
}

describe('canReturnForEdits', () => {
  test('the Coordinator may return a submitted draft', () => {
    expect(canReturnForEdits(submitted)).toBe(true)
  })

  test('a Creator or a Contributor may not', () => {
    expect(canReturnForEdits({ ...submitted, roleLevel: 2 })).toBe(false)
    expect(canReturnForEdits({ ...submitted, roleLevel: 3 })).toBe(false)
  })

  test('an unsubmitted draft has nothing to return', () => {
    expect(canReturnForEdits({ ...submitted, submittedAt: null })).toBe(false)
  })

  test('only a draft can be returned', () => {
    expect(canReturnForEdits({ ...submitted, state: 'archived' })).toBe(false)
  })
})

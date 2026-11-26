import { describe, expect, test } from 'vitest'

import { canSubmitForReview } from './can-submit-for-review'

const contributor = { id: 'contributor', role: { level: 3 } }
const creator = { id: 'creator', role: { level: 2 } }
const coordinator = { id: 'coordinator', role: { level: 1 } }

const draft = {
  authorId: 'contributor',
  authors: [contributor],
  state: 'draft' as const,
  submittedAt: null,
}

describe('canSubmitForReview', () => {
  test('an author may submit an unsubmitted draft', () => {
    expect(canSubmitForReview(draft)).toBe(true)
  })

  test('any co-author may submit', () => {
    expect(
      canSubmitForReview({
        ...draft,
        authorId: 'creator',
        authors: [contributor, creator],
      }),
    ).toBe(true)
  })

  test('someone who is not an author may not', () => {
    expect(canSubmitForReview({ ...draft, authorId: 'coordinator' })).toBe(
      false,
    )
  })

  test('an already submitted draft is not submitted again', () => {
    expect(canSubmitForReview({ ...draft, submittedAt: new Date() })).toBe(
      false,
    )
  })

  test('only a draft can be submitted', () => {
    expect(canSubmitForReview({ ...draft, state: 'published' })).toBe(false)
    expect(canSubmitForReview({ ...draft, state: 'archived' })).toBe(false)
  })

  test('with a Coordinator among the authors no approval is needed', () => {
    expect(
      canSubmitForReview({ ...draft, authors: [contributor, coordinator] }),
    ).toBe(false)
  })
})

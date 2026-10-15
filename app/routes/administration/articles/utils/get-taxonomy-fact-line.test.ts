import { describe, expect, test } from 'vitest'

import { getTaxonomyFactLine } from './get-taxonomy-fact-line'

const base = {
  authorName: 'Ondřej Beneš',
  submission: null,
  submittedByName: null,
  updatedAt: new Date('2026-06-14T10:00:00Z'),
}

describe('getTaxonomyFactLine', () => {
  test('a draft names its author', () => {
    expect(getTaxonomyFactLine({ ...base, state: 'draft' })).toBe(
      'Ondřej Beneš',
    )
  })

  test('a waiting one says who sent it and when', () => {
    expect(
      getTaxonomyFactLine({
        ...base,
        state: 'draft',
        submission: {
          date: new Date('2026-09-26T08:00:00Z'),
          state: 'pending',
        },
        submittedByName: 'Jakub Novák',
      }),
    ).toBe('Odesláno · Jakub Novák · 26. 9. 2026')
  })

  test('a waiting one whose sender is gone falls back to its author', () => {
    expect(
      getTaxonomyFactLine({
        ...base,
        state: 'draft',
        submission: {
          date: new Date('2026-09-26T08:00:00Z'),
          state: 'pending',
        },
      }),
    ).toBe('Odesláno · Ondřej Beneš · 26. 9. 2026')
  })

  test('an approved one still names its author', () => {
    expect(
      getTaxonomyFactLine({
        ...base,
        state: 'draft',
        submission: {
          date: new Date('2026-09-27T08:00:00Z'),
          state: 'approved',
        },
      }),
    ).toBe('Ondřej Beneš')
  })

  test('a published one has no line', () => {
    expect(getTaxonomyFactLine({ ...base, state: 'published' })).toBeNull()
  })

  test('an archived one says when it was archived', () => {
    expect(getTaxonomyFactLine({ ...base, state: 'archived' })).toBe(
      'Archivováno 14. 6. 2026',
    )
  })
})

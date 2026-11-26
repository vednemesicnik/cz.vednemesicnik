import { describe, expect, test } from 'vitest'

import { getIssueFactLine } from './get-issue-fact-line'

const issue = {
  authorName: 'Ondřej Beneš',
  submission: null,
  submittedByName: null,
  updatedAt: new Date('2026-06-14T10:00:00Z'),
}

describe('getIssueFactLine', () => {
  test('a draft names its author (yzyd9p1l)', () => {
    expect(getIssueFactLine({ ...issue, state: 'draft' })).toBe(
      'Autor: Ondřej Beneš',
    )
  })

  test('a waiting one says who sent it and when', () => {
    expect(
      getIssueFactLine({
        ...issue,
        state: 'draft',
        submission: {
          date: new Date('2026-09-26T10:00:00Z'),
          state: 'pending',
        },
        submittedByName: 'Jakub Novák',
      }),
    ).toBe('Odesláno · Jakub Novák · 26. 9. 2026')
  })

  test('an archived one says when', () => {
    expect(getIssueFactLine({ ...issue, state: 'archived' })).toBe(
      'Archivováno 14. 6. 2026',
    )
  })

  test('a published one has none', () => {
    expect(getIssueFactLine({ ...issue, state: 'published' })).toBeNull()
  })
})

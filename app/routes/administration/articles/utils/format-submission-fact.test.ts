import { describe, expect, it } from 'vitest'

import { formatSubmissionFact } from './format-submission-fact'

describe('formatSubmissionFact', () => {
  it('says since when a draft waits', () => {
    expect(
      formatSubmissionFact({
        date: new Date('2026-09-25T10:00:00Z'),
        state: 'pending',
      }),
    ).toBe('od 25. 9. 2026')
  })

  it('gives the approval’s date', () => {
    expect(
      formatSubmissionFact({
        date: new Date('2026-09-26T10:00:00Z'),
        state: 'approved',
      }),
    ).toBe('26. 9. 2026')
  })
})

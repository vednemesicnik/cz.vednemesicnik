import { describe, expect, test } from 'vitest'

import { getDashboardRowLines } from './get-dashboard-row-lines'

const now = new Date('2026-10-29T13:30:00Z')

const base = {
  authorLine: 'Anna Dvořáková',
  contextLine: 'Kabinet',
  factLine: 'od 25. 9. 2026',
  holdLine: null,
  liveChange: undefined,
  now,
}

describe('getDashboardRowLines', () => {
  test('the queue says what the row belongs to and who wrote it', () => {
    expect(getDashboardRowLines({ ...base, section: 'queue' })).toEqual({
      detail: 'od 25. 9. 2026',
      note: 'Kabinet · Anna Dvořáková',
    })
  })

  test('one’s own row needs no author', () => {
    expect(
      getDashboardRowLines({ ...base, contextLine: null, section: 'drafts' }),
    ).toEqual({ detail: 'od 25. 9. 2026', note: null })
  })

  test('who edits it comes before a live change, which comes before the fact', () => {
    const liveChange = {
      name: 'Jakub Novák',
      // 14:02 in Prague (CET), whatever the machine's zone.
      occurredAt: new Date('2026-10-29T13:02:00Z'),
      sequence: 1,
      tintStartedAt: 0,
    }

    expect(
      getDashboardRowLines({ ...base, liveChange, section: 'queue' }).detail,
    ).toBe('změna 14:02 · Jakub Novák')
    expect(
      getDashboardRowLines({
        ...base,
        holdLine: 'upravuje Jakub Novák',
        liveChange,
        section: 'queue',
      }).detail,
    ).toBe('upravuje Jakub Novák')
  })
})

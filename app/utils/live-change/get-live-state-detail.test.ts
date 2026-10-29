import { describe, expect, test } from 'vitest'

import { getLiveStateDetail } from './get-live-state-detail'

const now = new Date('2026-10-29T15:00:00')

const liveChange = {
  name: 'Jakub Novák',
  occurredAt: new Date('2026-10-29T14:02:00'),
  sequence: 1,
  tintStartedAt: 0,
}

describe('getLiveStateDetail', () => {
  test('is the fact without a live change', () => {
    expect(
      getLiveStateDetail({
        factLine: 'od 25. 9. 2026',
        liveChange: undefined,
        now,
      }),
    ).toBe('od 25. 9. 2026')
  })

  test('names the live change in place of the fact', () => {
    expect(
      getLiveStateDetail({ factLine: 'od 25. 9. 2026', liveChange, now }),
    ).toBe('změna 14:02 · Jakub Novák')
  })

  test('names the live change where a published row has no fact', () => {
    expect(getLiveStateDetail({ factLine: null, liveChange, now })).toBe(
      'změna 14:02 · Jakub Novák',
    )
  })

  test('puts who edits it first', () => {
    expect(
      getLiveStateDetail({
        factLine: 'od 25. 9. 2026',
        holdLine: 'upravuje Eva Malá',
        liveChange,
        now,
      }),
    ).toBe('upravuje Eva Malá')
  })

  test('goes back to the fact once an edit hold came after the change', () => {
    expect(
      getLiveStateDetail({
        factLine: 'od 25. 9. 2026',
        liveChange: { ...liveChange, isLineSuperseded: true },
        now,
      }),
    ).toBe('od 25. 9. 2026')
  })

  test('is nothing without a line', () => {
    expect(
      getLiveStateDetail({ factLine: null, liveChange: undefined, now }),
    ).toBeUndefined()
  })
})

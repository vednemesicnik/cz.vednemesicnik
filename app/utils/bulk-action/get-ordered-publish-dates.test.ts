import { describe, expect, test } from 'vitest'

import { getOrderedPublishDates } from './get-ordered-publish-dates'

describe('getOrderedPublishDates', () => {
  test('gives the top article the base moment and each next a second less', () => {
    const base = new Date('2026-10-13T10:00:00.000Z')

    expect(
      getOrderedPublishDates(base, 3).map((date) => date.toISOString()),
    ).toEqual([
      '2026-10-13T10:00:00.000Z',
      '2026-10-13T09:59:59.000Z',
      '2026-10-13T09:59:58.000Z',
    ])
  })

  test('is empty for no articles', () => {
    expect(getOrderedPublishDates(new Date(), 0)).toEqual([])
  })
})

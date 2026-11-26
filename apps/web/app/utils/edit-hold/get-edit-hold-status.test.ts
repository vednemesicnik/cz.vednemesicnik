import { describe, expect, test } from 'vitest'

import { getEditHoldStatus } from './get-edit-hold-status'

const now = new Date('2026-10-15T14:00:00.000Z')
const hold = {
  heldByAuthorId: 'anna',
  heldByTabId: 'tab-1',
  heldSince: new Date('2026-10-15T13:55:00.000Z'),
  heldUntil: new Date('2026-10-15T14:01:00.000Z'),
}

describe('getEditHoldStatus', () => {
  test('nobody holds it', () => {
    expect(
      getEditHoldStatus(
        {
          heldByAuthorId: null,
          heldByTabId: null,
          heldSince: null,
          heldUntil: null,
        },
        { authorId: 'anna', now },
      ),
    ).toBe('free')
  })

  test('an expired hold is free, with no release (07g)', () => {
    expect(
      getEditHoldStatus(hold, { authorId: 'jakub', now: hold.heldUntil }),
    ).toBe('free')
  })

  test('tells the holding tab, another tab and someone else apart', () => {
    expect(
      getEditHoldStatus(hold, { authorId: 'anna', now, tabId: 'tab-1' }),
    ).toBe('own-tab')
    expect(
      getEditHoldStatus(hold, { authorId: 'anna', now, tabId: 'tab-2' }),
    ).toBe('own-other-tab')
    expect(getEditHoldStatus(hold, { authorId: 'anna', now })).toBe(
      'own-other-tab',
    )
    expect(getEditHoldStatus(hold, { authorId: 'jakub', now })).toBe('other')
  })
})

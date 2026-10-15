import { describe, expect, test } from 'vitest'

import { getReadOnlyNotice } from './get-read-only-notice'

const holder = {
  lastSavedAt: '2026-10-15T12:31:00.000Z',
  name: 'Marie Horáková',
  since: '2026-10-15T12:33:00.000Z',
}

describe('getReadOnlyNotice', () => {
  test('taken over: who edits it now', () => {
    expect(
      getReadOnlyNotice({ holder, isEditable: true, status: 'lost' }),
    ).toBe('Jen ke čtení. Článek upravuje Marie Horáková.')
  })

  test('free again: only that it reads', () => {
    expect(
      getReadOnlyNotice({
        awayMilliseconds: 0,
        holder: null,
        isEditable: true,
        status: 'changed',
      }),
    ).toBe('Jen ke čtení.')
  })

  test('holding: nothing', () => {
    expect(getReadOnlyNotice({ status: 'holding' })).toBeNull()
  })
})

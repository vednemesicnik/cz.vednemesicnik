import { describe, expect, test } from 'vitest'

import { getIssueSaveLineText } from './get-issue-save-line-text'

const now = new Date('2026-10-20T14:40:00.000Z')
const savedAt = new Date('2026-10-20T12:02:00.000Z')

describe('getIssueSaveLineText', () => {
  test('a new draft before its first save', () => {
    expect(getIssueSaveLineText({ now, savedAt: null, status: 'idle' })).toBe(
      'Zatím neuloženo',
    )
  })

  test('the last save', () => {
    expect(getIssueSaveLineText({ now, savedAt, status: 'saved' })).toBe(
      'uloženo dnes v 14:02',
    )
  })

  test.each([
    ['pending', 'ukládá se'],
    ['saving', 'ukládá se'],
    ['offline', 'bez připojení · čeká na uložení'],
    ['failed', 'Nepodařilo se uložit.'],
  ] as const)('%s', (status, expected) => {
    expect(getIssueSaveLineText({ now, savedAt, status })).toBe(expected)
  })
})

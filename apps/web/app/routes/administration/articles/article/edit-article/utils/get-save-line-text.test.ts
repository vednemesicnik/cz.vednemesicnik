import { describe, expect, test } from 'vitest'

import { getSaveLineText } from './get-save-line-text'

const now = new Date('2026-10-15T12:30:00Z')

const base = {
  isEmpty: false,
  now,
  savedAt: new Date('2026-10-15T12:02:00Z'),
  status: 'saved' as const,
}

describe('getSaveLineText (design 24e)', () => {
  test('saved today gives the time', () => {
    expect(getSaveLineText(base)).toBe('uloženo dnes v 14:02')
  })

  test('saved another day gives the date and the time', () => {
    expect(
      getSaveLineText({
        ...base,
        savedAt: new Date('2026-09-25T12:02:00Z'),
      }),
    ).toBe('uloženo 25. 9. 2026 v 14:02')
  })

  test('after midnight, a save from yesterday is no longer today', () => {
    expect(
      getSaveLineText({
        ...base,
        now: new Date('2026-10-15T22:05:00Z'),
        savedAt: new Date('2026-10-15T21:55:00Z'),
      }),
    ).toBe('uloženo 15. 10. 2026 v 23:55')
  })

  test('an empty new draft', () => {
    expect(getSaveLineText({ ...base, isEmpty: true })).toBe('Zatím prázdné')
    expect(getSaveLineText({ ...base, isEmpty: true, status: 'idle' })).toBe(
      'Zatím prázdné',
    )
  })

  test('saving, from the first letter until the server answers', () => {
    expect(getSaveLineText({ ...base, isEmpty: true, status: 'pending' })).toBe(
      'ukládá se',
    )
    expect(getSaveLineText({ ...base, status: 'saving' })).toBe('ukládá se')
  })

  test('offline and failed', () => {
    expect(getSaveLineText({ ...base, status: 'offline' })).toBe(
      'bez připojení · čeká na uložení',
    )
    expect(getSaveLineText({ ...base, status: 'failed' })).toBe(
      'Nepodařilo se uložit.',
    )
  })
})

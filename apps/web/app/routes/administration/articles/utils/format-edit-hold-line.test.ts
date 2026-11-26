import { describe, expect, test } from 'vitest'

import { formatEditHoldLine } from './format-edit-hold-line'

const now = new Date('2026-10-15T14:30:00.000Z')

describe('formatEditHoldLine', () => {
  test('the list says who (22f)', () => {
    expect(
      formatEditHoldLine({ holderName: 'Tereza Malá', isOwn: false, now }),
    ).toBe('upravuje Tereza Malá')
    expect(
      formatEditHoldLine({ holderName: 'Tereza Malá', isOwn: true, now }),
    ).toBe('upravujete vy')
  })

  test('the detail says since when, with the date past midnight (23g)', () => {
    expect(
      formatEditHoldLine({
        holderName: 'Jakub Novák',
        isOwn: false,
        now,
        since: new Date('2026-10-15T12:02:00.000Z'),
      }),
    ).toBe('upravuje Jakub Novák od 14:02')
    expect(
      formatEditHoldLine({
        holderName: 'Jakub Novák',
        isOwn: false,
        now,
        since: new Date('2026-10-14T21:50:00.000Z'),
      }),
    ).toBe('upravuje Jakub Novák od 14. 10. 2026, 23:50')
  })

  test('one’s own hold has no time, in the detail too (hgb3jeqj)', () => {
    expect(
      formatEditHoldLine({
        holderName: 'Anna Dvořáková',
        isOwn: true,
        now,
        since: new Date('2026-10-15T12:02:00.000Z'),
      }),
    ).toBe('upravujete vy')
  })
})

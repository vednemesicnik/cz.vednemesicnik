import { describe, expect, test } from 'vitest'

import { formatLiveChangeLine } from './format-live-change-line'

describe('formatLiveChangeLine', () => {
  test('the same day gives the time', () => {
    expect(
      formatLiveChangeLine({
        name: 'Jakub Novák',
        now: new Date('2026-10-13T15:00:00Z'),
        occurredAt: new Date('2026-10-13T12:02:00Z'),
      }),
    ).toBe('změna 14:02 · Jakub Novák')
  })

  test('another day gives the date', () => {
    expect(
      formatLiveChangeLine({
        name: 'Jakub Novák',
        now: new Date('2026-10-02T08:00:00Z'),
        occurredAt: new Date('2026-10-01T20:00:00Z'),
      }),
    ).toBe('změna 1. 10. 2026 · Jakub Novák')
  })

  test('the day is the Prague day, not the UTC one', () => {
    // 23:30 UTC on 12 Oct is 01:30 on 13 Oct in Prague.
    expect(
      formatLiveChangeLine({
        name: 'Anna Dvořáková',
        now: new Date('2026-10-13T08:00:00Z'),
        occurredAt: new Date('2026-10-12T23:30:00Z'),
      }),
    ).toBe('změna 1:30 · Anna Dvořáková')
  })
})

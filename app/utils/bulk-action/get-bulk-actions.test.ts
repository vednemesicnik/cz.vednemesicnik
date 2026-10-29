import { describe, expect, test } from 'vitest'

import { getBulkActions } from './get-bulk-actions'

describe('getBulkActions', () => {
  test('a Coordinator publishes and deletes an unsubmitted draft', () => {
    expect(
      getBulkActions({
        isApprover: true,
        menu: ['submit', 'publish', 'delete'],
        row: 'edit',
      }),
    ).toEqual(['publish', 'delete'])
  })

  test('a waiting article joins publishing through Schválit a publikovat…', () => {
    expect(
      getBulkActions({
        isApprover: true,
        menu: ['approve-and-publish', 'return', 'edit'],
        row: 'approve',
      }),
    ).toEqual(['publish'])
  })

  test('an approved article joins publishing through its row action', () => {
    expect(
      getBulkActions({ isApprover: true, menu: ['return'], row: 'publish' }),
    ).toEqual(['publish'])
  })

  test('only the Coordinator publishes in bulk', () => {
    expect(
      getBulkActions({ isApprover: false, menu: ['publish'], row: 'publish' }),
    ).toEqual([])
  })

  test('a published article joins retracting and archiving, a Creator’s too', () => {
    expect(
      getBulkActions({
        isApprover: false,
        menu: ['view-on-web', 'retract', 'archive'],
        row: null,
      }),
    ).toEqual(['retract', 'archive'])
  })

  test('a Coordinator’s published article keeps the 07c order past the date change', () => {
    expect(
      getBulkActions({
        isApprover: true,
        menu: ['view-on-web', 'change-date', 'retract', 'archive'],
        row: null,
      }),
    ).toEqual(['retract', 'archive'])
  })

  test('an archived article joins restoring and deleting', () => {
    expect(
      getBulkActions({
        isApprover: true,
        menu: ['restore', 'delete'],
        row: null,
      }),
    ).toEqual(['restore', 'delete'])
  })

  test('a Contributor’s own draft joins only deleting', () => {
    expect(
      getBulkActions({
        isApprover: false,
        menu: ['submit', 'delete'],
        row: 'edit',
      }),
    ).toEqual(['delete'])
  })

  test('no state offers more than two bulk actions (ji6n8th3)', () => {
    const rows = [
      { menu: ['submit', 'publish', 'delete'], row: 'edit' },
      { menu: ['approve-and-publish', 'return', 'edit'], row: 'approve' },
      { menu: ['return', 'edit'], row: 'publish' },
      { menu: ['view-on-web', 'change-date', 'retract', 'archive'], row: null },
      { menu: ['restore', 'delete'], row: null },
    ]

    for (const row of rows) {
      expect(
        getBulkActions({ ...row, isApprover: true }).length,
      ).toBeLessThanOrEqual(2)
    }
  })
})

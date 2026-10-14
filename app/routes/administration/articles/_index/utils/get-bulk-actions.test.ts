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

  test('a published article joins archiving', () => {
    expect(
      getBulkActions({
        isApprover: false,
        menu: ['view-on-web', 'retract', 'archive'],
        row: null,
      }),
    ).toEqual(['archive'])
  })

  test('an archived article joins deleting', () => {
    expect(
      getBulkActions({
        isApprover: true,
        menu: ['restore', 'delete'],
        row: null,
      }),
    ).toEqual(['delete'])
  })
})

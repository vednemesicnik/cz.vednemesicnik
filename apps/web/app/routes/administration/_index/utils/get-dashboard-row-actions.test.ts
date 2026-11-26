import { describe, expect, test } from 'vitest'

import { getDashboardRowActions } from './get-dashboard-row-actions'

describe('getDashboardRowActions', () => {
  test('the queue puts Schválit on the row and the rest in „⋯“', () => {
    expect(
      getDashboardRowActions({
        actions: ['approve', 'approve-and-publish', 'return'],
        preferred: 'approve',
      }),
    ).toEqual({ menu: ['approve-and-publish', 'return'], row: 'approve' })
  })

  test('a row without the section’s action has „⋯“ only', () => {
    expect(
      getDashboardRowActions({
        actions: ['approve-and-publish', 'return'],
        preferred: 'approve',
      }),
    ).toEqual({ menu: ['approve-and-publish', 'return'], row: null })
  })

  test('Odeslané has no row action', () => {
    expect(
      getDashboardRowActions({ actions: ['withdraw'], preferred: null }),
    ).toEqual({ menu: ['withdraw'], row: null })
  })
})

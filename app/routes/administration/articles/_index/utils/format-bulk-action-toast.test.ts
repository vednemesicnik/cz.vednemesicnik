import { describe, expect, test } from 'vitest'

import { formatBulkActionToast } from './format-bulk-action-toast'

describe('formatBulkActionToast', () => {
  test('names the verb and the real count', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        onlyDrafts: false,
        processedCount: 3,
        skippedCount: 0,
      }),
    ).toBe('Publikováno: 3 články')
  })

  test('adds what was skipped', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 1,
      }),
    ).toBe('Publikováno: 2 články. Přeskočeno: 1 článek.')
  })

  test('says nothing was done when everything was skipped', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        onlyDrafts: false,
        processedCount: 0,
        skippedCount: 3,
      }),
    ).toBe('Nic nebylo publikováno. Přeskočeno: 3 články.')
  })

  test('archives articles', () => {
    expect(
      formatBulkActionToast({
        action: 'archive',
        onlyDrafts: false,
        processedCount: 7,
        skippedCount: 0,
      }),
    ).toBe('Archivováno: 7 článků')
  })

  test('deleting only drafts counts koncepty', () => {
    expect(
      formatBulkActionToast({
        action: 'delete',
        onlyDrafts: true,
        processedCount: 3,
        skippedCount: 0,
      }),
    ).toBe('Smazáno: 3 koncepty')
  })

  test('deleting a mixed selection counts články', () => {
    expect(
      formatBulkActionToast({
        action: 'delete',
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 1,
      }),
    ).toBe('Smazáno: 2 články. Přeskočeno: 1 článek.')
  })
})

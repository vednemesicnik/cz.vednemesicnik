import { describe, expect, it } from 'vitest'

import { CATEGORY_NOUN, ISSUE_NOUN, TAG_NOUN } from '~/config/list-noun-config'

import { formatBulkDeleteToast } from './format-bulk-delete-toast'

describe('formatBulkDeleteToast', () => {
  it.each([
    [1, 'Smazáno: 1 číslo'],
    [2, 'Smazáno: 2 čísla'],
    [5, 'Smazáno: 5 čísel'],
  ])('counts %i issues as "%s"', (count, expected) => {
    expect(formatBulkDeleteToast(count, ISSUE_NOUN.countForms)).toBe(expected)
  })

  it('declines the list noun', () => {
    expect(formatBulkDeleteToast(3, CATEGORY_NOUN.countForms)).toBe(
      'Smazáno: 3 rubriky',
    )
    expect(formatBulkDeleteToast(8, TAG_NOUN.countForms)).toBe(
      'Smazáno: 8 štítků',
    )
  })

  it('says nothing was deleted', () => {
    expect(formatBulkDeleteToast(0, ISSUE_NOUN.countForms)).toBe(
      'Nic nebylo smazáno',
    )
  })
})

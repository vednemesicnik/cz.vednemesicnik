import { describe, expect, it } from 'vitest'

import { getIssueBulkDeleteConfirmation } from './get-issue-bulk-delete-confirmation'

const issue = (index: number) => ({
  id: `issue-${index}`,
  title: `zima 202${index}`,
})

describe('getIssueBulkDeleteConfirmation', () => {
  it('counts two issues and lists their titles (26f)', () => {
    expect(getIssueBulkDeleteConfirmation([issue(5), issue(6)])).toEqual({
      confirmLabel: 'Smazat 2 čísla',
      description: 'Smažou se i jejich nahrané soubory. Vrátit to nejde.',
      items: [
        { id: 'issue-5', label: 'zima 2025' },
        { id: 'issue-6', label: 'zima 2026' },
      ],
      title: 'Smazat 2 čísla?',
    })
  })

  it('agrees with one issue', () => {
    expect(getIssueBulkDeleteConfirmation([issue(5)]).description).toBe(
      'Smažou se i jeho nahrané soubory. Vrátit to nejde.',
    )
  })

  it.each([
    [1, 'Smazat 1 číslo?'],
    [5, 'Smazat 5 čísel?'],
  ])('declines %i issues as "%s"', (count, expected) => {
    const issues = Array.from({ length: count }, (_, index) => issue(index))
    expect(getIssueBulkDeleteConfirmation(issues).title).toBe(expected)
  })
})

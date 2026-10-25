import { describe, expect, it } from 'vitest'

import { AUTHOR_RECORD_COPY } from '../../author-record-copy'
import { getAuthorBulkDeleteConfirmation } from './get-author-bulk-delete-confirmation'

const NAMES = [
  'Jana Nová',
  'Jan Novák',
  'Petra Svobodová',
  'Karel Dvořák',
  'Eva Horáková',
  'Tomáš Černý',
]

const authors = (count: number) =>
  NAMES.slice(0, count).map((name, index) => ({ id: `author-${index}`, name }))

describe('getAuthorBulkDeleteConfirmation', () => {
  it('counts three authors and lists their names in order (28g)', () => {
    expect(getAuthorBulkDeleteConfirmation(authors(3))).toEqual({
      confirmLabel: 'Smazat 3 autory',
      description: 'Autoři se trvale smažou.',
      items: [
        { id: 'author-0', label: 'Jana Nová' },
        { id: 'author-1', label: 'Jan Novák' },
        { id: 'author-2', label: 'Petra Svobodová' },
      ],
      title: 'Smazat 3 autory?',
    })
  })

  it('agrees with one author', () => {
    expect(getAuthorBulkDeleteConfirmation(authors(1))).toEqual({
      confirmLabel: 'Smazat 1 autora',
      description: 'Autor se trvale smaže.',
      items: [{ id: 'author-0', label: 'Jana Nová' }],
      title: 'Smazat 1 autora?',
    })
  })

  it('declines six authors, the bar hiding the list above five', () => {
    const confirmation = getAuthorBulkDeleteConfirmation(authors(6))

    expect(confirmation.title).toBe('Smazat 6 autorů?')
    expect(confirmation.confirmLabel).toBe('Smazat 6 autorů')
    expect(confirmation.items).toHaveLength(6)
  })
})

describe('AUTHOR_RECORD_COPY.bulkDelete.toast', () => {
  it.each([
    [0, 'Nic nebylo smazáno'],
    [1, 'Smazáno: 1 autor'],
    [3, 'Smazáno: 3 autoři'],
    [7, 'Smazáno: 7 autorů'],
  ])('reports %i deleted as "%s"', (deletedCount, expected) => {
    expect(AUTHOR_RECORD_COPY.bulkDelete.toast(deletedCount)).toBe(expected)
  })
})

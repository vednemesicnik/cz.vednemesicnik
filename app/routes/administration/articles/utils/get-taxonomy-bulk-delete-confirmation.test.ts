import { describe, expect, it } from 'vitest'

import { CATEGORY_RECORD_COPY } from '../categories/category-record-copy'
import { TAG_RECORD_COPY } from '../tags/tag-record-copy'
import { getTaxonomyBulkDeleteConfirmation } from './get-taxonomy-bulk-delete-confirmation'

const record = (name: string, articleCount: number) => ({
  articleCount,
  id: name,
  name,
})

describe('getTaxonomyBulkDeleteConfirmation', () => {
  it('lists each category with its own article count (25g)', () => {
    expect(
      getTaxonomyBulkDeleteConfirmation(
        [
          record('Ankety', 3),
          record('Fejetony', 5),
          record('Školní výlety', 0),
        ],
        CATEGORY_RECORD_COPY,
      ),
    ).toEqual({
      confirmLabel: 'Smazat 3 rubriky',
      description:
        'Rubriky se trvale smažou a odeberou z přiřazených článků. Články se nesmažou.',
      items: [
        { id: 'Ankety', label: 'Ankety (3 články)' },
        { id: 'Fejetony', label: 'Fejetony (5 článků)' },
        { id: 'Školní výlety', label: 'Školní výlety' },
      ],
      title: 'Smazat 3 rubriky?',
    })
  })

  it('says only the deletion when no category has articles', () => {
    const confirmation = getTaxonomyBulkDeleteConfirmation(
      [record('Ankety', 0), record('Fejetony', 0)],
      CATEGORY_RECORD_COPY,
    )
    expect(confirmation.description).toBe('Rubriky se trvale smažou.')
  })

  it('agrees with one category, in the accusative', () => {
    const confirmation = getTaxonomyBulkDeleteConfirmation(
      [record('Ankety', 1)],
      CATEGORY_RECORD_COPY,
    )
    expect(confirmation.title).toBe('Smazat 1 rubriku?')
    expect(confirmation.confirmLabel).toBe('Smazat 1 rubriku')
    expect(confirmation.description).toBe(
      'Rubrika se trvale smaže a odebere z přiřazených článků. Články se nesmažou.',
    )
    expect(confirmation.items).toEqual([
      { id: 'Ankety', label: 'Ankety (1 článek)' },
    ])
  })

  it('speaks of tags in the masculine (25e)', () => {
    const confirmation = getTaxonomyBulkDeleteConfirmation(
      Array.from({ length: 8 }, (_, index) => record(`štítek ${index}`, 4)),
      TAG_RECORD_COPY,
    )
    expect(confirmation.title).toBe('Smazat 8 štítků?')
    expect(confirmation.confirmLabel).toBe('Smazat 8 štítků')
    expect(confirmation.description).toBe(
      'Štítky se trvale smažou a odeberou z přiřazených článků. Články se nesmažou.',
    )
  })

  it('toasts the deleted count', () => {
    expect(CATEGORY_RECORD_COPY.bulkDelete.toast(3)).toBe('Smazáno: 3 rubriky')
    expect(TAG_RECORD_COPY.bulkDelete.toast(1)).toBe('Smazáno: 1 štítek')
  })
})

import { describe, expect, test } from 'vitest'

import { getTaxonomyConflictErrors } from './get-taxonomy-conflict-errors'

const copy = {
  takenName: 'Název je obsazený.',
  takenSlug: 'Adresa je obsazená.',
}

describe('getTaxonomyConflictErrors', () => {
  test('puts each error at its own field', () => {
    expect(
      getTaxonomyConflictErrors(
        { isNameTaken: true, slugSuggestion: 'skola-2' },
        copy,
      ),
    ).toEqual({ name: [copy.takenName], slug: [copy.takenSlug] })
  })

  test('reports only the taken address', () => {
    expect(
      getTaxonomyConflictErrors(
        { isNameTaken: false, slugSuggestion: 'skola-2' },
        copy,
      ),
    ).toEqual({ slug: [copy.takenSlug] })
  })

  test('reports only the taken name', () => {
    expect(
      getTaxonomyConflictErrors(
        { isNameTaken: true, slugSuggestion: null },
        copy,
      ),
    ).toEqual({ name: [copy.takenName] })
  })
})

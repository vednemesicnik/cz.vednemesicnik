import { describe, expect, test } from 'vitest'

import { getTaxonomyConflicts } from './get-taxonomy-conflicts'

const otherRecords = [
  { name: 'Škola', slug: 'skola' },
  { name: 'Kultura', slug: 'kultura' },
]

describe('getTaxonomyConflicts', () => {
  test('reports a taken address with a free suggestion', () => {
    expect(
      getTaxonomyConflicts(otherRecords, { name: 'Školy', slug: 'skola' }),
    ).toEqual({ isNameTaken: false, slugSuggestion: 'skola-2' })
  })

  test('reports a name taken in another letter case', () => {
    expect(
      getTaxonomyConflicts(otherRecords, { name: 'škola', slug: 'skoly' }),
    ).toEqual({ isNameTaken: true, slugSuggestion: null })
  })

  test('reports both at once', () => {
    expect(
      getTaxonomyConflicts(otherRecords, { name: 'Kultura', slug: 'kultura' }),
    ).toEqual({ isNameTaken: true, slugSuggestion: 'kultura-2' })
  })

  test('finds nothing for a free name and address', () => {
    expect(
      getTaxonomyConflicts(otherRecords, { name: 'Sport', slug: 'sport' }),
    ).toEqual({ isNameTaken: false, slugSuggestion: null })
  })
})

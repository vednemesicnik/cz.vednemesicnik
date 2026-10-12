import { describe, expect, test } from 'vitest'

import { getSavedFilterSummary } from './get-saved-filter-summary'

describe('getSavedFilterSummary', () => {
  test('names the queue, the search and the filters in order', () => {
    expect(
      getSavedFilterSummary({
        authorName: 'Marie Horáková',
        categoryName: 'Škola',
        query: 'maturita',
        queueLabel: 'Koncepty',
        tagName: undefined,
      }),
    ).toBe(
      'Uloží se: Koncepty, hledání „maturita“, rubrika Škola, autor Marie Horáková.',
    )
  })

  test('names the tag', () => {
    expect(
      getSavedFilterSummary({
        authorName: undefined,
        categoryName: undefined,
        query: '',
        queueLabel: undefined,
        tagName: 'Ples',
      }),
    ).toBe('Uloží se: štítek Ples.')
  })

  test('does not double the period of a name that ends with one', () => {
    expect(
      getSavedFilterSummary({
        authorName: 'Vedneměsíčník, z. s.',
        categoryName: undefined,
        query: '',
        queueLabel: 'Koncepty',
        tagName: undefined,
      }),
    ).toBe('Uloží se: Koncepty, autor Vedneměsíčník, z. s.')
  })

  test('is empty when nothing would be saved', () => {
    expect(
      getSavedFilterSummary({
        authorName: undefined,
        categoryName: undefined,
        query: '',
        queueLabel: undefined,
        tagName: undefined,
      }),
    ).toBe('')
  })
})

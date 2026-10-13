import { describe, expect, test } from 'vitest'

import { getSavedFilterSummary } from './get-saved-filter-summary'

const NONE = {
  authorNames: [],
  categoryNames: [],
  query: '',
  stateLabels: [],
  tagNames: [],
}

describe('getSavedFilterSummary', () => {
  test('lists one filter per line, in the order of the filter row', () => {
    expect(
      getSavedFilterSummary({
        authorNames: ['Marie Horáková'],
        categoryNames: ['Škola', 'Sport'],
        query: 'maturita',
        stateLabels: ['Koncepty', 'Ke schválení'],
        tagNames: [],
      }),
    ).toEqual([
      'Stav: Koncepty nebo Ke schválení',
      'Hledání: „maturita“',
      'Rubrika: Škola nebo Sport',
      'Autor: Marie Horáková',
    ])
  })

  test('joins three values with commas and „nebo“', () => {
    expect(
      getSavedFilterSummary({
        ...NONE,
        stateLabels: ['Koncepty', 'Ke schválení', 'Schválené'],
      }),
    ).toEqual(['Stav: Koncepty, Ke schválení nebo Schválené'])
  })

  test('names the tag', () => {
    expect(getSavedFilterSummary({ ...NONE, tagNames: ['Ples'] })).toEqual([
      'Štítek: Ples',
    ])
  })

  test('leaves out what is default', () => {
    expect(getSavedFilterSummary({ ...NONE, query: 'ples' })).toEqual([
      'Hledání: „ples“',
    ])
  })

  test('is empty when nothing would be saved', () => {
    expect(getSavedFilterSummary(NONE)).toEqual([])
  })
})

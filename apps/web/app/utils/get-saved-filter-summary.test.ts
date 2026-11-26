import { describe, expect, test } from 'vitest'

import { getSavedFilterSummary } from './get-saved-filter-summary'

const filters = ({
  stateLabels = [],
  categoryNames = [],
  tagNames = [],
  authorNames = [],
}: {
  stateLabels?: string[]
  categoryNames?: string[]
  tagNames?: string[]
  authorNames?: string[]
}) => [
  { label: 'Stav', valueLabels: stateLabels },
  { label: 'Rubrika', valueLabels: categoryNames },
  { label: 'Štítek', valueLabels: tagNames },
  { label: 'Autor', valueLabels: authorNames },
]

describe('getSavedFilterSummary', () => {
  test('lists one filter per line, in the order of the filter row', () => {
    expect(
      getSavedFilterSummary({
        filters: filters({
          authorNames: ['Marie Horáková'],
          categoryNames: ['Škola', 'Sport'],
          stateLabels: ['Koncepty', 'Ke schválení'],
        }),
        query: 'maturita',
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
        filters: filters({
          stateLabels: ['Koncepty', 'Ke schválení', 'Schválené'],
        }),
        query: '',
      }),
    ).toEqual(['Stav: Koncepty, Ke schválení nebo Schválené'])
  })

  test('puts the search first when the first filter is not set', () => {
    expect(
      getSavedFilterSummary({
        filters: filters({ tagNames: ['Ples'] }),
        query: 'ples',
      }),
    ).toEqual(['Hledání: „ples“', 'Štítek: Ples'])
  })

  test('leaves out what is default', () => {
    expect(
      getSavedFilterSummary({ filters: filters({}), query: 'ples' }),
    ).toEqual(['Hledání: „ples“'])
  })

  test('is empty when nothing would be saved', () => {
    expect(getSavedFilterSummary({ filters: filters({}), query: '' })).toEqual(
      [],
    )
  })
})

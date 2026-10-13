import { describe, expect, test } from 'vitest'

import { getFilterButtonText } from './get-filter-button-text'

describe('getFilterButtonText', () => {
  test('is the name alone without a value', () => {
    expect(getFilterButtonText('Štítek', [])).toEqual({
      accessibleName: 'Štítek',
      more: '',
      values: '',
    })
  })

  test('shows one value', () => {
    expect(getFilterButtonText('Rubrika', ['Škola'])).toEqual({
      accessibleName: 'Rubrika: Škola',
      more: '',
      values: 'Škola',
    })
  })

  test('lists two values', () => {
    expect(getFilterButtonText('Rubrika', ['Škola', 'Sport'])).toEqual({
      accessibleName: 'Rubrika: Škola, Sport',
      more: '',
      values: 'Škola, Sport',
    })
  })

  test('shows the first of three values and the number of the others', () => {
    expect(
      getFilterButtonText('Štítek', ['maturita', 'přijímačky', 'ples']),
    ).toEqual({
      accessibleName: 'Štítek: maturita, přijímačky, ples',
      more: '+2',
      values: 'maturita',
    })
  })
})

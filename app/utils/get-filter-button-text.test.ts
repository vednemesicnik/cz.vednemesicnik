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

  test('reads a description after the name', () => {
    expect(
      getFilterButtonText('Stav', [], 'na schválení čeká celkem 1 článek'),
    ).toEqual({
      accessibleName: 'Stav, na schválení čeká celkem 1 článek',
      more: '',
      values: '',
    })
  })

  test('reads a description after the values', () => {
    expect(
      getFilterButtonText(
        'Stav',
        ['Koncepty', 'Ke schválení'],
        'na schválení čekají celkem 2 články',
      ),
    ).toEqual({
      accessibleName:
        'Stav: Koncepty, Ke schválení, na schválení čekají celkem 2 články',
      more: '',
      values: 'Koncepty, Ke schválení',
    })
  })
})

import { describe, expect, test } from 'vitest'

import { getIssueTileLabels } from './get-issue-tile-labels'

const issue = { name: null, order: 3, supplement: null, year: 2026 }

describe('getIssueTileLabels', () => {
  test('puts the order under the name with the year', () => {
    expect(getIssueTileLabels({ ...issue, name: 'podzim' })).toEqual({
      label: 'podzim 2026',
      sublabel: '3/2026',
    })
  })

  test('is only the order without a name', () => {
    expect(getIssueTileLabels(issue)).toEqual({
      label: '3/2026',
      sublabel: null,
    })
  })

  test('names a supplement by its own name and its main issue', () => {
    expect(
      getIssueTileLabels(
        { ...issue, order: 2, supplement: 'Maturitní ples' },
        'červen',
      ),
    ).toEqual({
      label: 'Maturitní ples',
      sublabel: 'doplněk k číslu červen 2026',
    })
  })

  test('names the main issue by the order when the viewer cannot see its name', () => {
    expect(
      getIssueTileLabels({
        ...issue,
        name: 'podzim',
        order: 2,
        supplement: 'Maturitní ples',
      }),
    ).toEqual({
      label: 'Maturitní ples',
      sublabel: 'doplněk k číslu 2/2026',
    })
  })
})

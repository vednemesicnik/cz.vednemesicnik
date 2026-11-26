import { describe, expect, test } from 'vitest'

import { getOptionLabels } from './get-option-labels'

const options = [
  { label: 'Koncepty', value: 'draft' },
  { label: 'Ke schválení', value: 'pending' },
  { label: 'Publikované', value: 'published' },
]

describe('getOptionLabels', () => {
  test('names the selected values in menu order', () => {
    expect(getOptionLabels(options, ['published', 'draft'])).toEqual([
      'Koncepty',
      'Publikované',
    ])
  })

  test('is empty without a selection', () => {
    expect(getOptionLabels(options, undefined)).toEqual([])
  })
})

import { describe, expect, test } from 'vitest'

import { CATEGORY_NOUN } from '~/config/list-noun-config'

import { getStateFilter } from './get-state-filter'

const COUNTS = [
  { count: 2, queue: 'draft' as const },
  { count: 1, queue: 'pending' as const },
  { count: 0, queue: 'approved' as const },
]

describe('getStateFilter', () => {
  test('offers the queues with their counts', () => {
    const { options } = getStateFilter({
      isApprover: true,
      isContributor: false,
      noun: CATEGORY_NOUN,
      queueCounts: COUNTS,
    })

    expect(options.map((option) => [option.label, option.count])).toEqual([
      ['Koncepty', 2],
      ['Ke schválení', 1],
      ['Schválené', 0],
      ['Publikované', undefined],
      ['Archivované', undefined],
    ])
  })

  test('gives a Contributor Odeslané instead of Ke schválení and Schválené', () => {
    const { options } = getStateFilter({
      isApprover: false,
      isContributor: true,
      noun: CATEGORY_NOUN,
      queueCounts: [
        { count: 1, queue: 'draft' },
        { count: 3, queue: 'submitted' },
      ],
    })

    expect(options.map((option) => option.value)).toEqual([
      'draft',
      'submitted',
      'published',
      'archived',
    ])
  })

  test('puts the waiting work on the button for the Coordinator', () => {
    const { attention, options } = getStateFilter({
      isApprover: true,
      isContributor: false,
      noun: CATEGORY_NOUN,
      queueCounts: COUNTS,
    })

    expect(attention).toEqual({
      count: 1,
      description: 'na schválení čeká celkem 1 rubrika',
    })
    expect(
      options.find((option) => option.value === 'pending')?.attention,
    ).toBe(true)
  })

  test('shows nothing waiting when nothing waits or to a Creator', () => {
    expect(
      getStateFilter({
        isApprover: true,
        isContributor: false,
        noun: CATEGORY_NOUN,
        queueCounts: [{ count: 0, queue: 'pending' }],
      }).attention,
    ).toBeUndefined()
    expect(
      getStateFilter({
        isApprover: false,
        isContributor: false,
        noun: CATEGORY_NOUN,
        queueCounts: COUNTS,
      }).attention,
    ).toBeUndefined()
  })
})

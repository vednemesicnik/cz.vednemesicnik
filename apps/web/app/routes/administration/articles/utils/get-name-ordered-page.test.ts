import { describe, expect, test } from 'vitest'

import { getNameOrderedPage } from './get-name-ordered-page'

const records = [
  'Test 226',
  'druhá zkouška',
  'Test 3',
  'chemie',
  'hudba',
  'šachy',
  'zima',
].map((name) => ({ id: name, name }))

describe('getNameOrderedPage', () => {
  test('orders names the Czech way, whatever their case', () => {
    expect(
      getNameOrderedPage(records, { order: 'asc', page: 1, pageSize: 20 }),
    ).toEqual({
      pageIds: [
        'druhá zkouška',
        'hudba',
        'chemie',
        'šachy',
        'Test 3',
        'Test 226',
        'zima',
      ],
      totalCount: 7,
    })
  })

  test('reverses for a descending order', () => {
    expect(
      getNameOrderedPage(records, { order: 'desc', page: 1, pageSize: 2 })
        .pageIds,
    ).toEqual(['zima', 'Test 226'])
  })

  test('returns the requested page and the total', () => {
    expect(
      getNameOrderedPage(records, { order: 'asc', page: 2, pageSize: 3 }),
    ).toEqual({ pageIds: ['šachy', 'Test 3', 'Test 226'], totalCount: 7 })
  })
})

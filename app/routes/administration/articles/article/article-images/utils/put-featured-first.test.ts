import { describe, expect, test } from 'vitest'

import { putFeaturedFirst } from './put-featured-first'

describe('putFeaturedFirst', () => {
  test('puts the main image first, the others in their order', () => {
    expect(putFeaturedFirst(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
  })

  test('keeps the order without a main image', () => {
    expect(putFeaturedFirst(['a', 'b'], null)).toEqual(['a', 'b'])
  })

  test('keeps the order when the main image is not in the list', () => {
    expect(putFeaturedFirst(['a', 'b'], 'x')).toEqual(['a', 'b'])
  })

  test('does not change the input', () => {
    const ids = ['a', 'b']
    putFeaturedFirst(ids, 'b')
    expect(ids).toEqual(['a', 'b'])
  })
})

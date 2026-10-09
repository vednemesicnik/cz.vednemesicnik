import { describe, expect, test } from 'vitest'

import { isPagePastLast } from '~/utils/is-page-past-last'

describe('isPagePastLast', () => {
  test.each([
    ['the first page of an empty list', 1, 0],
    ['the first page of a single page', 1, 1],
    ['the last page', 3, 3],
    ['a page before the last', 2, 3],
  ])('should keep %s', (_label, currentPage, totalPages) => {
    expect(isPagePastLast(currentPage, totalPages)).toBe(false)
  })

  test.each([
    ['the second page of an empty list', 2, 0],
    ['one page past the last', 4, 3],
    ['a page far past the last', 99, 3],
  ])('should reject %s', (_label, currentPage, totalPages) => {
    expect(isPagePastLast(currentPage, totalPages)).toBe(true)
  })
})

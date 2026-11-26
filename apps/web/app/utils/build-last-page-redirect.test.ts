import { describe, expect, test } from 'vitest'

import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'

const redirectFor = (search: string, totalPages: number) =>
  buildLastPageRedirect(
    new URL(`https://x/administration/articles${search}`),
    totalPages,
  )

describe('buildLastPageRedirect', () => {
  test('should set the page to the last page', () => {
    expect(redirectFor('?page=5', 3)).toBe('/administration/articles?page=3')
  })

  test.each([
    ['the last page is 1', 1],
    ['the list is empty', 0],
  ])('should drop the page when %s', (_label, totalPages) => {
    expect(redirectFor('?q=foo&page=2', totalPages)).toBe(
      '/administration/articles?q=foo',
    )
  })

  test('should return the bare pathname when the page was the only param', () => {
    expect(redirectFor('?page=2', 1)).toBe('/administration/articles')
  })

  test('should keep the other params in their order', () => {
    expect(
      redirectFor(
        '?q=foo&state=draft&category=rozhovory&page=9&sort=title&order=asc&filter=abc',
        4,
      ),
    ).toBe(
      '/administration/articles?q=foo&state=draft&category=rozhovory&page=4&sort=title&order=asc&filter=abc',
    )
  })
})

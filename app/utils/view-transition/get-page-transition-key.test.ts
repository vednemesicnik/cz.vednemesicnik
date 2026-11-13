import { describe, expect, test } from 'vitest'

import { getPageTransitionKey } from './get-page-transition-key'

describe('getPageTransitionKey', () => {
  test('is the path alone without a search', () => {
    expect(getPageTransitionKey('/donate', '')).toBe('/donate')
  })

  test('keeps the page of a list', () => {
    expect(getPageTransitionKey('/articles', '?page=2')).toBe(
      '/articles?page=2',
    )
  })

  test("drops React Router's index marker", () => {
    expect(getPageTransitionKey('/donate/request-confirmation', '?index')).toBe(
      '/donate/request-confirmation',
    )
  })

  test("drops a step's intent", () => {
    expect(
      getPageTransitionKey(
        '/organization/membership/application/signature',
        '?intent=verify-code',
      ),
    ).toBe('/organization/membership/application/signature')
  })

  test('keeps the other parameters around them', () => {
    expect(getPageTransitionKey('/articles', '?index&page=2&intent=a')).toBe(
      '/articles?page=2',
    )
  })
})

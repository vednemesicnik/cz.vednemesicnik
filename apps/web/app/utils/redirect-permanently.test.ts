import { describe, expect, test } from 'vitest'

import { redirectPermanently } from './redirect-permanently'

describe('redirectPermanently', () => {
  test('answers 301 with the query kept', () => {
    const response = redirectPermanently(
      new URL('https://test.local/old?q=kultura&state=draft'),
      '/new',
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe('/new?q=kultura&state=draft')
  })

  test('adds nothing without a query', () => {
    const response = redirectPermanently(
      new URL('https://test.local/old'),
      '/new',
    )

    expect(response.headers.get('Location')).toBe('/new')
  })
})

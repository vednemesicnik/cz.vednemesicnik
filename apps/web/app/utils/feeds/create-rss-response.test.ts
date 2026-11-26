import { describe, expect, test } from 'vitest'

import { createRssResponse } from './create-rss-response'

describe('createRssResponse', () => {
  test('should serve the document as RSS, cacheable for five minutes', async () => {
    const response = createRssResponse('<rss/>')

    expect(response.headers.get('Content-Type')).toBe(
      'application/rss+xml; charset=utf-8',
    )
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(await response.text()).toBe('<rss/>')
  })
})

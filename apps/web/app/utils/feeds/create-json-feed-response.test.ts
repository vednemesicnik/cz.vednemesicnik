import { describe, expect, test } from 'vitest'

import { createJsonFeedResponse } from './create-json-feed-response'

describe('createJsonFeedResponse', () => {
  test('should serve the document as a JSON Feed, cacheable for five minutes', async () => {
    const response = createJsonFeedResponse('{}')

    expect(response.headers.get('Content-Type')).toBe(
      'application/feed+json; charset=utf-8',
    )
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(await response.text()).toBe('{}')
  })
})

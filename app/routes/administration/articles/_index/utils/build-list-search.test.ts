import { describe, expect, test } from 'vitest'

import { buildQueueSearch } from './build-queue-search'

describe('buildQueueSearch', () => {
  test('sets the queue and keeps search, filters and sort', () => {
    expect(
      buildQueueSearch(
        new URLSearchParams('q=ples&category=skola&sort=title'),
        'pending',
      ),
    ).toBe('?q=ples&category=skola&sort=title&state=pending')
  })

  test('Vše drops the queue from the URL', () => {
    expect(
      buildQueueSearch(new URLSearchParams('state=draft'), undefined),
    ).toBe('')
  })

  test('restarts the page', () => {
    expect(
      buildQueueSearch(new URLSearchParams('state=draft&page=3'), 'archived'),
    ).toBe('?state=archived')
  })

  test('the saved filter marker becomes explicitly unfiltered', () => {
    expect(
      buildQueueSearch(
        new URLSearchParams('filter=abc&state=draft'),
        undefined,
      ),
    ).toBe('?filter=none')
  })
})

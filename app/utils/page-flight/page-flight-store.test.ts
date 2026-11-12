import { describe, expect, test, vi } from 'vitest'

import { createPageFlightStore } from './page-flight-store'

const flight = {
  kind: 'article-row' as const,
  name: 'article-image-a1',
  source: '/resources/article-image/a1-192.jpg',
}

describe('createPageFlightStore', () => {
  test('holds no flight at first', () => {
    expect(createPageFlightStore().read()).toBeNull()
  })

  test('holds the flight it was started with until it is cleared', () => {
    const store = createPageFlightStore()

    store.start(flight)
    expect(store.read()).toEqual(flight)

    store.clear()
    expect(store.read()).toBeNull()
  })

  test('tells its listeners of a start and a clear, not of a clear with nothing to clear', () => {
    const store = createPageFlightStore()
    const listener = vi.fn()

    store.subscribe(listener)
    store.clear()
    expect(listener).not.toHaveBeenCalled()

    store.start(flight)
    store.clear()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  test('stops telling a listener once it unsubscribes', () => {
    const store = createPageFlightStore()
    const listener = vi.fn()

    const unsubscribe = store.subscribe(listener)
    unsubscribe()
    store.start(flight)

    expect(listener).not.toHaveBeenCalled()
  })
})

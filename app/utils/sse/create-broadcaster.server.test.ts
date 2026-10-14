import { afterEach, describe, expect, test, vi } from 'vitest'

import { createBroadcaster } from './create-broadcaster.server'

const event = { data: '{"value":1}', event: 'content-change' }

afterEach(() => {
  vi.useRealTimers()
})

describe('createBroadcaster', () => {
  test('publish reaches every subscriber of the topic', () => {
    const broadcaster = createBroadcaster()
    const first = vi.fn()
    const second = vi.fn()

    broadcaster.subscribe('admin', first)
    broadcaster.subscribe('admin', second)
    broadcaster.publish('admin', event)

    expect(first).toHaveBeenCalledWith(event)
    expect(second).toHaveBeenCalledWith(event)
  })

  test('leaves subscribers of other topics untouched', () => {
    const broadcaster = createBroadcaster()
    const other = vi.fn()

    broadcaster.subscribe('other', other)
    broadcaster.publish('admin', event)

    expect(other).not.toHaveBeenCalled()
  })

  test('unsubscribe stops delivery', () => {
    const broadcaster = createBroadcaster()
    const subscriber = vi.fn()

    const unsubscribe = broadcaster.subscribe('admin', subscriber)
    unsubscribe()
    broadcaster.publish('admin', event)

    expect(subscriber).not.toHaveBeenCalled()
  })

  test('a throwing subscriber does not block the others', () => {
    const broadcaster = createBroadcaster()
    const healthy = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    broadcaster.subscribe('admin', () => {
      throw new Error('dead subscriber')
    })
    broadcaster.subscribe('admin', healthy)

    expect(() => broadcaster.publish('admin', event)).not.toThrow()
    expect(healthy).toHaveBeenCalledWith(event)
  })

  test('replays a retained event to a late subscriber', () => {
    const broadcaster = createBroadcaster()
    const late = vi.fn()

    broadcaster.publish('upload', event, { retain: true })
    broadcaster.subscribe('upload', late)

    expect(late).toHaveBeenCalledWith(event)
  })

  test('a retained event expires after its TTL', () => {
    vi.useFakeTimers()
    const broadcaster = createBroadcaster({
      retainedEventTtlMilliseconds: 1000,
    })
    const late = vi.fn()

    broadcaster.publish('upload', event, { retain: true })
    vi.advanceTimersByTime(1000)
    broadcaster.subscribe('upload', late)

    expect(late).not.toHaveBeenCalled()
  })

  test('removes the topic after the last unsubscribe', () => {
    const broadcaster = createBroadcaster()

    const unsubscribeFirst = broadcaster.subscribe('admin', vi.fn())
    const unsubscribeSecond = broadcaster.subscribe('admin', vi.fn())
    expect(broadcaster.subscriberCount('admin')).toBe(2)

    unsubscribeFirst()
    unsubscribeSecond()
    expect(broadcaster.subscriberCount('admin')).toBe(0)

    // A stale unsubscribe must not drop a newer subscriber set.
    const subscriber = vi.fn()
    broadcaster.subscribe('admin', subscriber)
    unsubscribeFirst()
    broadcaster.publish('admin', event)
    expect(subscriber).toHaveBeenCalledWith(event)
  })
})

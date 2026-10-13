import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createSharedEventSource } from './create-shared-event-source'

type FakeEventSource = {
  url: string
  readyState: number
  onerror: (() => void) | null
  close: () => void
  addEventListener: (eventName: string, listener: EventListener) => void
  removeEventListener: (eventName: string, listener: EventListener) => void
  emit: (eventName: string, data: string) => void
}

let sources: FakeEventSource[] = []

const createFakeEventSource = (url: string): FakeEventSource => {
  const listeners = new Map<string, Set<EventListener>>()
  const source: FakeEventSource = {
    addEventListener: (eventName, listener) => {
      const set = listeners.get(eventName) ?? new Set()
      set.add(listener)
      listeners.set(eventName, set)
    },
    close: vi.fn(() => {
      source.readyState = 2
    }),
    emit: (eventName, data) => {
      for (const listener of listeners.get(eventName) ?? []) {
        listener(new MessageEvent(eventName, { data }))
      }
    },
    onerror: null,
    readyState: 1,
    removeEventListener: (eventName, listener) => {
      listeners.get(eventName)?.delete(listener)
    },
    url,
  }
  sources.push(source)
  return source
}

beforeEach(() => {
  sources = []
  vi.stubGlobal(
    'EventSource',
    Object.assign(
      // biome-ignore lint/complexity/useArrowFunction: EventSource is called with `new`.
      vi.fn(function (url: string) {
        return createFakeEventSource(url)
      }),
      { CLOSED: 2 },
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('createSharedEventSource', () => {
  test('opens nothing until the first subscription', () => {
    createSharedEventSource('/events')

    expect(sources).toHaveLength(0)
  })

  test('two subscribers share one connection', () => {
    const shared = createSharedEventSource('/events')
    const first = vi.fn()
    const second = vi.fn()

    shared.subscribe('content-change', first)
    shared.subscribe('content-change', second)
    sources[0]?.emit('content-change', '{}')

    expect(sources).toHaveLength(1)
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  test('the last unsubscribe closes after the grace, a new subscribe reopens', () => {
    vi.useFakeTimers()
    const shared = createSharedEventSource('/events')

    const unsubscribeFirst = shared.subscribe('content-change', vi.fn())
    const unsubscribeSecond = shared.subscribe('content-change', vi.fn())

    unsubscribeFirst()
    unsubscribeSecond()
    expect(sources[0]?.close).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(sources[0]?.close).toHaveBeenCalledOnce()

    shared.subscribe('content-change', vi.fn())
    expect(sources).toHaveLength(2)
  })

  test('a subscribe within the grace keeps the connection', () => {
    vi.useFakeTimers()
    const shared = createSharedEventSource('/events')
    const listener = vi.fn()

    const unsubscribe = shared.subscribe('content-change', vi.fn())
    unsubscribe()
    shared.subscribe('content-change', listener)
    vi.advanceTimersByTime(1000)

    expect(sources).toHaveLength(1)
    expect(sources[0]?.close).not.toHaveBeenCalled()
    sources[0]?.emit('content-change', '{}')
    expect(listener).toHaveBeenCalledOnce()
  })

  test('reconnects after the browser gives up, while subscribed', () => {
    vi.useFakeTimers()
    const shared = createSharedEventSource('/events')
    const listener = vi.fn()
    shared.subscribe('content-change', listener)

    const first = sources[0] as FakeEventSource
    first.readyState = 2
    first.onerror?.()
    vi.advanceTimersByTime(10_000)

    expect(sources).toHaveLength(2)
    sources[1]?.emit('content-change', '{}')
    expect(listener).toHaveBeenCalledOnce()
  })

  test('does nothing without EventSource', () => {
    vi.stubGlobal('EventSource', undefined)
    const shared = createSharedEventSource('/events')

    const unsubscribe = shared.subscribe('content-change', vi.fn())

    expect(sources).toHaveLength(0)
    expect(() => unsubscribe()).not.toThrow()
  })
})

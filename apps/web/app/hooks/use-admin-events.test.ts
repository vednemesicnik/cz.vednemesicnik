// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useAdminEvents } from './use-admin-events'

type Listener = (message: MessageEvent<string>) => void

const { listeners, revalidator } = vi.hoisted(() => ({
  listeners: new Map<string, Set<(message: MessageEvent<string>) => void>>(),
  revalidator: { revalidate: vi.fn(), state: 'idle' },
}))

vi.mock('react-router', () => ({ useRevalidator: () => revalidator }))

vi.mock('~/utils/sse/admin-event-source', () => ({
  adminEventSource: {
    subscribe: (eventName: string, listener: Listener) => {
      const set = listeners.get(eventName) ?? new Set()
      set.add(listener)
      listeners.set(eventName, set)
      return () => set.delete(listener)
    },
  },
}))

const emit = (eventName: string, event: object) => {
  for (const listener of listeners.get(eventName) ?? []) {
    listener(new MessageEvent(eventName, { data: JSON.stringify(event) }))
  }
}

const accountEvent = {
  change: 'update',
  entity: 'user',
  entityId: 'u1',
  occurredAt: '2026-10-24T12:00:00.000Z',
}

const setVisibility = (visibilityState: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: visibilityState,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  listeners.clear()
  revalidator.state = 'idle'
  setVisibility('visible')
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useAdminEvents', () => {
  test('revalidates once after a burst of events, past the debounce', () => {
    renderHook(() => useAdminEvents('account-change'))

    emit('account-change', accountEvent)
    emit('account-change', accountEvent)
    expect(revalidator.revalidate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(revalidator.revalidate).toHaveBeenCalledOnce()
  })

  test('hears only its own event name', () => {
    renderHook(() => useAdminEvents('account-change'))

    emit('content-change', accountEvent)
    vi.advanceTimersByTime(300)

    expect(revalidator.revalidate).not.toHaveBeenCalled()
  })

  test('skips events the filter rejects', () => {
    const onEvent = vi.fn()
    renderHook(() =>
      useAdminEvents('account-change', {
        filter: (event) => event.entity === 'author',
        onEvent,
      }),
    )

    emit('account-change', accountEvent)
    vi.advanceTimersByTime(300)

    expect(onEvent).not.toHaveBeenCalled()
    expect(revalidator.revalidate).not.toHaveBeenCalled()
  })

  test('a hidden tab waits and revalidates on return', () => {
    renderHook(() => useAdminEvents('account-change'))

    setVisibility('hidden')
    emit('account-change', accountEvent)
    vi.advanceTimersByTime(300)
    expect(revalidator.revalidate).not.toHaveBeenCalled()

    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(300)
    expect(revalidator.revalidate).toHaveBeenCalledOnce()
  })

  test('unmounting unsubscribes', () => {
    const { unmount } = renderHook(() => useAdminEvents('account-change'))

    unmount()

    expect(listeners.get('account-change')?.size).toBe(0)
  })
})

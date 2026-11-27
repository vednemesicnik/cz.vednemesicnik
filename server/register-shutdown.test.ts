import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { registerShutdown } from './register-shutdown.ts'

// Promise.withResolvers, which the host's ES2022 lib doesn't type.
const deferred = <T>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Lets the promises the shutdown chains settle, without moving the clock.
const flush = () => vi.advanceTimersByTimeAsync(0)

const setUp = (onShutdown?: () => Promise<void>) => {
  let closeCallback: ((error?: Error) => void) | undefined
  const listeners = new Map<string, () => void>()
  const server = {
    close: vi.fn((callback?: (error?: Error) => void) => {
      closeCallback = callback
    }),
    closeIdleConnections: vi.fn(),
  }
  const exit = vi.fn()

  registerShutdown({
    exit,
    graceMilliseconds: 4000,
    onShutdown,
    server,
    subscribe: (signal, listener) => listeners.set(signal, listener),
  })

  return {
    exit,
    finishClose: () => closeCallback?.(),
    send: (signal: string) => listeners.get(signal)?.(),
    server,
  }
}

describe('registerShutdown', () => {
  test('closes the server and exits once open requests finish', async () => {
    const { exit, finishClose, send, server } = setUp()

    send('SIGTERM')
    await flush()

    expect(server.close).toHaveBeenCalledOnce()
    expect(server.closeIdleConnections).toHaveBeenCalledOnce()
    expect(exit).not.toHaveBeenCalled()

    finishClose()
    await flush()

    expect(exit).toHaveBeenCalledWith(0)
  })

  test('stops the rest alongside the server and exits once both are done', async () => {
    const { promise, resolve } = deferred<void>()
    const onShutdown = vi.fn(() => promise)
    const { exit, finishClose, send } = setUp(onShutdown)

    send('SIGTERM')

    expect(onShutdown).toHaveBeenCalledOnce()

    finishClose()
    await flush()
    expect(exit).not.toHaveBeenCalled()

    resolve()
    await flush()
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('exits when stopping the rest fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { exit, finishClose, send } = setUp(async () => {
      throw new Error('queue')
    })

    send('SIGTERM')
    finishClose()
    await flush()

    expect(exit).toHaveBeenCalledWith(0)
    expect(console.error).toHaveBeenCalled()
  })

  test('exits after the grace period when a request stays open', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { exit, send } = setUp()

    send('SIGINT')
    vi.advanceTimersByTime(3999)
    expect(exit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('shuts down once when both signals arrive', () => {
    const { send, server } = setUp()

    send('SIGTERM')
    send('SIGINT')

    expect(server.close).toHaveBeenCalledOnce()
  })
})

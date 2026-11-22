import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { registerShutdown } from './register-shutdown.ts'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const setUp = () => {
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
  test('closes the server and exits once open requests finish', () => {
    const { exit, finishClose, send, server } = setUp()

    send('SIGTERM')

    expect(server.close).toHaveBeenCalledOnce()
    expect(server.closeIdleConnections).toHaveBeenCalledOnce()
    expect(exit).not.toHaveBeenCalled()

    finishClose()

    expect(exit).toHaveBeenCalledWith(0)
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

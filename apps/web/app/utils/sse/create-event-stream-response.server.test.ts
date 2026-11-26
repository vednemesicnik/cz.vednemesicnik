import { afterEach, describe, expect, test, vi } from 'vitest'

import { createBroadcaster } from './create-broadcaster.server'
import { createEventStreamResponse } from './create-event-stream-response.server'

// The singleton is replaced by an injected broadcaster in every test.
vi.mock('./broadcaster.server', () => ({ broadcaster: undefined }))

const decoder = new TextDecoder()

const setUp = () => {
  const broadcaster = createBroadcaster()
  const abortController = new AbortController()
  const request = new Request('https://test.local/resources/admin-events', {
    signal: abortController.signal,
  })
  const response = createEventStreamResponse(request, {
    broadcaster,
    topic: 'admin',
  })
  const reader = (response.body as ReadableStream<Uint8Array>).getReader()

  const readChunk = async () => {
    const { value } = await reader.read()
    return decoder.decode(value)
  }

  return { abortController, broadcaster, readChunk, reader, response }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createEventStreamResponse', () => {
  test('sets the streaming headers', () => {
    const { response } = setUp()

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform')
    expect(response.headers.get('Connection')).toBe('keep-alive')
    expect(response.headers.get('X-Accel-Buffering')).toBe('no')
  })

  test('frames a published event as SSE', async () => {
    const { broadcaster, readChunk } = setUp()

    expect(await readChunk()).toBe(': connected\n\n')

    broadcaster.publish('admin', {
      data: '{"entityId":"a1"}',
      event: 'content-change',
    })

    expect(await readChunk()).toBe(
      'event: content-change\ndata: {"entityId":"a1"}\n\n',
    )
  })

  test('sends a heartbeat every 25 seconds', async () => {
    vi.useFakeTimers()
    const { readChunk } = setUp()
    await readChunk()

    vi.advanceTimersByTime(25_000)

    expect(await readChunk()).toBe(': ping\n\n')
  })

  test('abort unsubscribes and closes the stream', async () => {
    const { abortController, broadcaster, reader } = setUp()
    expect(broadcaster.subscriberCount('admin')).toBe(1)

    abortController.abort()

    expect(broadcaster.subscriberCount('admin')).toBe(0)
    await reader.read()
    expect((await reader.read()).done).toBe(true)
    // Publishing after close must not throw (no enqueue on a closed stream).
    expect(() =>
      broadcaster.publish('admin', { data: '{}', event: 'content-change' }),
    ).not.toThrow()
  })

  test('cancel unsubscribes, and a later abort is harmless', async () => {
    const { abortController, broadcaster, reader } = setUp()

    await reader.cancel()

    expect(broadcaster.subscriberCount('admin')).toBe(0)
    expect(() => abortController.abort()).not.toThrow()
  })

  test('closes after 60 minutes', async () => {
    vi.useFakeTimers()
    const { broadcaster } = setUp()

    vi.advanceTimersByTime(60 * 60 * 1000)

    expect(broadcaster.subscriberCount('admin')).toBe(0)
  })

  test('an already aborted request subscribes nothing', () => {
    const broadcaster = createBroadcaster()
    const request = new Request('https://test.local/', {
      signal: AbortSignal.abort(),
    })

    createEventStreamResponse(request, { broadcaster, topic: 'admin' })

    expect(broadcaster.subscriberCount('admin')).toBe(0)
  })
})

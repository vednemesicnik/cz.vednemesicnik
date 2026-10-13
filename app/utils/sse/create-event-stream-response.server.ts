import { broadcaster as defaultBroadcaster } from './broadcaster.server'
import type { Broadcaster, ServerSentEvent } from './create-broadcaster.server'

// Under both Fly's proxy idle timeout (~60 s) and Cloudflare's (~100 s).
const HEARTBEAT_INTERVAL_MILLISECONDS = 25_000

// Cycles revoked sessions out: EventSource reconnects and re-authenticates.
const MAXIMUM_STREAM_DURATION_MILLISECONDS = 60 * 60 * 1000

const serializeServerSentEvent = ({ data, event, id }: ServerSentEvent) => {
  const idLine = id === undefined ? '' : `id: ${id}\n`
  const dataLines = data
    .split('\n')
    .map((line) => `data: ${line}\n`)
    .join('')

  return `${idLine}event: ${event}\n${dataLines}\n`
}

/**
 * Streams one broadcaster topic as `text/event-stream` until the client goes away
 * or {@link MAXIMUM_STREAM_DURATION_MILLISECONDS} passes, with a `: ping` comment
 * every {@link HEARTBEAT_INTERVAL_MILLISECONDS} to keep proxies from closing it.
 *
 * @param options - `topic` to stream; `broadcaster` defaults to the process
 *   singleton and is injectable for tests.
 */
export const createEventStreamResponse = (
  request: Request,
  options: { topic: string; broadcaster?: Broadcaster },
): Response => {
  const broadcaster = options.broadcaster ?? defaultBroadcaster
  const encoder = new TextEncoder()

  let closed = false
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      cleanup()
    },
    start(controller) {
      const enqueue = (chunk: string) => {
        if (!closed) {
          controller.enqueue(encoder.encode(chunk))
        }
      }

      const unsubscribe = broadcaster.subscribe(options.topic, (event) =>
        enqueue(serializeServerSentEvent(event)),
      )

      const heartbeat = setInterval(
        () => enqueue(': ping\n\n'),
        HEARTBEAT_INTERVAL_MILLISECONDS,
      )

      const expiry = setTimeout(
        () => cleanup(),
        MAXIMUM_STREAM_DURATION_MILLISECONDS,
      )

      cleanup = () => {
        if (closed) {
          return
        }

        closed = true
        clearInterval(heartbeat)
        clearTimeout(expiry)
        unsubscribe()
        request.signal.removeEventListener('abort', cleanup)

        try {
          controller.close()
        } catch {
          // Already cancelled by the consumer.
        }
      }

      if (request.signal.aborted) {
        cleanup()
        return
      }

      request.signal.addEventListener('abort', cleanup)

      // Sends the first bytes at once, so the client sees the stream open.
      enqueue(': connected\n\n')
    },
  })

  return new Response(stream, {
    headers: {
      // `no-transform` keeps @react-router/serve's compression() and Cloudflare
      // from buffering the stream; without it events stall in production only.
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  })
}

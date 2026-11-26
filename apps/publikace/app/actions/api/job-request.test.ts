import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { bodyOf, MAX_BODY_BYTES } from './job-request.ts'

const URL_OF_JOB = 'http://127.0.0.1/api/v1/print-handoff/report'

function post(body: BodyInit | null, headers: Record<string, string> = {}): Request {
  return new Request(URL_OF_JOB, { body, duplex: 'half', headers, method: 'POST' } as RequestInit)
}

/** A body that streams `chunks` of `size` bytes each, counting how many were pulled. */
function streamOf(chunks: number, size: number): { pulled: () => number; stream: ReadableStream } {
  let count = 0
  /* No high-water mark, so a chunk is pulled only when the body is read. */
  let stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (count === chunks) {
          controller.close()
          return
        }
        count += 1
        controller.enqueue(new Uint8Array(size).fill(0x20))
      },
    },
    { highWaterMark: 0 },
  )
  return { pulled: () => count, stream }
}

describe('the body of a job’s call', () => {
  it('reads an object, and nothing else', async () => {
    assert.deepEqual(await bodyOf(post('{"runKey":"run-1"}')), { runKey: 'run-1' })
    assert.equal(await bodyOf(post('[1]')), null)
    assert.equal(await bodyOf(post('{')), null)
    assert.equal(await bodyOf(post(null)), null)
  })

  it('takes a body exactly at the limit', async () => {
    let json = '{}'.padEnd(MAX_BODY_BYTES, ' ')
    assert.deepEqual(await bodyOf(post(json)), {})
  })

  it('refuses a body that declares more than the limit without reading it', async () => {
    let { pulled, stream } = streamOf(1, 2)
    let request = post(stream, { 'Content-Length': String(MAX_BODY_BYTES + 1) })
    assert.equal(await bodyOf(request), null)
    assert.equal(pulled(), 0)
  })

  it('stops reading a body that says nothing of its size once it passes the limit', async () => {
    let chunk = 1024 * 1024
    let { pulled, stream } = streamOf(64, chunk)
    assert.equal(await bodyOf(post(stream)), null)
    assert.ok(pulled() <= MAX_BODY_BYTES / chunk + 2, `${pulled()} chunks were pulled`)
  })
})

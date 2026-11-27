import { createHmac } from 'node:crypto'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createJobStarter } from './job-starter.server.ts'

const ENDPOINTS = {
  'artwork-replies': { secret: 'test-secret', url: 'https://script.test/replies/exec' },
}

describe('the job starter', () => {
  it('posts the job and its start key in an envelope signed over the exact payload', async () => {
    let sent: { body: string; url: string } | null = null
    let starter = createJobStarter(ENDPOINTS, {
      fetch: async (url, init) => {
        sent = { body: String(init?.body), url: String(url) }
        return Response.json({ ok: true })
      },
      now: () => 1_785_000_000,
    })

    assert.equal(starter.canStart('artwork-replies'), true)
    assert.deepEqual(await starter.start('artwork-replies', 's-1'), { ok: true })
    assert.ok(sent !== null)
    let { body, url } = sent as { body: string; url: string }
    assert.equal(url, 'https://script.test/replies/exec')
    let { payload, signature, timestamp } = JSON.parse(body) as {
      payload: string
      signature: string
      timestamp: number
    }
    assert.equal(timestamp, 1_785_000_000)
    assert.deepEqual(JSON.parse(payload), { job: 'artwork-replies', startKey: 's-1' })
    let expected = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${payload}`)
      .digest('hex')
    assert.equal(signature, expected)
  })

  it('fails without throwing on a refusal, a bad answer, a timeout and an unknown job', async () => {
    let answers = [
      async () => Response.json({ error: 'unauthorized', ok: false }),
      async () => new Response('Not Found', { status: 404 }),
      async () => new Response('<html>', { status: 200 }),
      async (): Promise<Response> => {
        throw new Error('The operation was aborted due to timeout')
      },
    ]
    let errors = []
    for (let answer of answers) {
      let result = await createJobStarter(ENDPOINTS, { fetch: answer }).start(
        'artwork-replies',
        's',
      )
      errors.push(result.ok ? 'ok' : 'failed')
    }
    assert.deepEqual(errors, ['failed', 'failed', 'failed', 'failed'])

    let starter = createJobStarter(ENDPOINTS, { fetch: async () => Response.json({ ok: true }) })
    assert.equal(starter.canStart('print-handoff'), false)
    assert.equal(starter.canStart('__proto__'), false)
    assert.deepEqual(await starter.start('print-handoff', 's'), {
      error: 'not configured',
      ok: false,
    })
  })
})

import { createHmac } from 'node:crypto'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createMailer, type MailMessage } from './mailer.server.ts'
import { welcomeEmail } from './welcome-email.server.ts'

const ENDPOINT = { secret: 'test-secret', url: 'https://mailer.test/exec' }
const MESSAGE: MailMessage = {
  htmlBody: '<p>Dobrý den</p>',
  idempotencyKey: 'article-welcome:1:tereza.vlkova@external.test',
  name: 'Vedneměsíčník – Publikace',
  subject: 'Článek',
  to: 'tereza.vlkova@external.test',
}

describe('the Mailer', () => {
  it('sends the message in an envelope signed over the exact payload', async () => {
    let received: { payload: string; signature: string; timestamp: number } | null = null
    let mailer = createMailer(ENDPOINT, {
      fetch: async (_url, init) => {
        received = JSON.parse(String(init?.body))
        return Response.json({ ok: true })
      },
      now: () => 1_785_000_000,
    })

    let result = await mailer(MESSAGE)

    assert.deepEqual(result, { ok: true })
    assert.ok(received !== null)
    let { payload, signature, timestamp } = received as {
      payload: string
      signature: string
      timestamp: number
    }
    assert.equal(timestamp, 1_785_000_000)
    assert.deepEqual(JSON.parse(payload), MESSAGE)
    let expected = createHmac('sha256', 'test-secret')
      .update(`${timestamp}.${payload}`)
      .digest('hex')
    assert.equal(signature, expected)
  })

  it('reads a refusal from the body, which always comes with HTTP 200', async () => {
    let mailer = createMailer(ENDPOINT, {
      fetch: async () => Response.json({ error: 'invalid_recipient', ok: false }),
    })
    assert.deepEqual(await mailer(MESSAGE), { error: 'invalid_recipient', ok: false })
  })

  it('turns a network failure into a refusal instead of throwing', async () => {
    let mailer = createMailer(ENDPOINT, {
      fetch: async () => {
        throw new TypeError('fetch failed')
      },
    })
    assert.equal((await mailer(MESSAGE)).ok, false)
  })
})

describe('the welcome e-mail', () => {
  it('escapes what the form gave and leaves out the co-author line for one author', () => {
    let message = welcomeEmail({
      articleName: 'Jídelna <b>po roce</b>',
      artworksUrl: 'https://publikace.vednemesicnik.test/l/p3Vd8nL1sQ6e/artworks',
      coauthors: [],
      documentUrl: 'https://docs.google.com/document/d/d-1/edit',
      formKey: '5b0c7a52-3f1e-4d6a-9c2b-8e4f1a7d6c30',
      issueName: 'VDM_2026_5',
      to: 'Tereza.Vlkova@external.test',
    })

    assert.equal(message.subject, 'Článek „Jídelna <b>po roce</b>“ je ve vydání VDM_2026_5')
    assert.ok(message.htmlBody.includes('Jídelna &lt;b&gt;po roce&lt;/b&gt;'))
    assert.ok(!message.htmlBody.includes('podílí'))
    assert.equal(
      message.idempotencyKey,
      'article-welcome:5b0c7a52-3f1e-4d6a-9c2b-8e4f1a7d6c30:tereza.vlkova@external.test',
    )
  })
})

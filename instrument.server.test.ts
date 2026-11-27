import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { afterEach, expect, test } from 'vitest'

const TYPED_PASSWORD = 'typed-password-probe'
const LINK_TOKEN = 'link-token-probe'
const EMAIL = 'owner@vednemesicnik.test'
const PATH = '/administration/sign-in/password'

// An application under the real instrument, the way `app:start-with-sentry` runs
// one. It prints the port it listens on, and reports an error for every request,
// with the tags in PROBE_TAGS when they are set, as Publikace's reporter does.
const APPLICATION = `
import { createServer } from 'node:http'
import * as Sentry from '@sentry/react-router'

const tags = process.env.PROBE_TAGS ? JSON.parse(process.env.PROBE_TAGS) : undefined

const server = createServer((request, response) => {
  request.on('data', () => {})
  request.on('end', async () => {
    Sentry.captureException(new Error('probe'), tags ? { tags } : undefined)
    await Sentry.flush(5000)
    response.end()
  })
})
server.listen(0, '127.0.0.1', () => console.log(server.address().port))
`

let application: ChildProcess | undefined
let ingest: Server | undefined

afterEach(() => {
  application?.kill()
  ingest?.close()
})

/** Starts a fake Sentry ingest, which hands over the first event it receives. */
const startIngest = async () => {
  let resolve: (event: Record<string, unknown>) => void
  const firstEvent = new Promise<Record<string, unknown>>((resolveEvent) => {
    resolve = resolveEvent
  })

  ingest = createServer((request, response) => {
    let envelope = ''
    request.on('data', (chunk) => {
      envelope += chunk
    })
    request.on('end', () => {
      const [, itemHeader, item] = envelope.split('\n')
      if (JSON.parse(itemHeader).type === 'event') resolve(JSON.parse(item))
      response.end('{}')
    })
  })
  ingest.listen(0, '127.0.0.1')
  await once(ingest, 'listening')

  return { firstEvent, port: (ingest.address() as AddressInfo).port }
}

const startApplication = async (
  ingestPort: number,
  tags?: Record<string, string>,
) => {
  const child = spawn(
    process.execPath,
    [
      '--import',
      './instrument.server.ts',
      '--input-type=module',
      '--eval',
      APPLICATION,
    ],
    {
      env: {
        PATH: process.env.PATH,
        PROBE_TAGS: tags ? JSON.stringify(tags) : undefined,
        SENTRY_DSN: `http://public@127.0.0.1:${ingestPort}/1`,
      } as unknown as NodeJS.ProcessEnv,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  )
  application = child

  const [port] = await once(child.stdout, 'data')
  return Number(String(port).trim())
}

test('an event carries neither the request body nor the query string', async () => {
  const { firstEvent, port: ingestPort } = await startIngest()
  const port = await startApplication(ingestPort)
  const origin = `http://127.0.0.1:${port}`
  const url = `${origin}${PATH}?token=${LINK_TOKEN}&email=${EMAIL}`

  await fetch(url, {
    body: new URLSearchParams({ email: EMAIL, password: TYPED_PASSWORD }),
    headers: { referer: url },
    method: 'POST',
  })

  const event = await firstEvent

  expect(event.tags).toMatchObject({ app: 'web' })
  expect(event.request).toMatchObject({
    headers: { referer: `${origin}${PATH}` },
    method: 'POST',
    url: `${origin}${PATH}`,
  })
  expect(JSON.stringify(event)).not.toContain(TYPED_PASSWORD)
  expect(JSON.stringify(event)).not.toContain(LINK_TOKEN)
  expect(JSON.stringify(event)).not.toContain(EMAIL)
}, 30_000)

test("Publikace's tags take the place of the web's", async () => {
  const { firstEvent, port: ingestPort } = await startIngest()
  const port = await startApplication(ingestPort, {
    app: 'publikace',
    area: 'request',
  })

  await fetch(`http://127.0.0.1:${port}/issues`)

  expect((await firstEvent).tags).toMatchObject({
    app: 'publikace',
    area: 'request',
  })
}, 30_000)

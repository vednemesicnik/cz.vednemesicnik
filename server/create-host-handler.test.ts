import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { createHostHandler } from './create-host-handler.ts'

const ORIGIN = 'http://web.localhost'
const UNKNOWN_ORIGIN = 'http://unknown.test'
const PUBLIKACE_ORIGIN = 'http://publikace.localhost'
const LARGE_SCRIPT = `export const text = '${'a'.repeat(4096)}'\n`

let clientDirectory: string

beforeAll(async () => {
  clientDirectory = await mkdtemp(join(tmpdir(), 'host-handler-'))
  await mkdir(join(clientDirectory, 'assets'))
  await writeFile(
    join(clientDirectory, 'assets', 'entry-abc123.js'),
    LARGE_SCRIPT,
  )
  await writeFile(join(clientDirectory, 'favicon.ico'), 'icon')
})

afterAll(async () => {
  await rm(clientDirectory, { force: true, recursive: true })
})

const setUp = () => {
  const webHandler = vi.fn(
    async () =>
      new Response('web', { headers: { 'Content-Type': 'text/plain' } }),
  )
  const publikaceHandler = vi.fn(async () => new Response('publikace'))
  const log = vi.fn()
  const handler = createHostHandler({
    clientDirectory,
    log,
    publikaceHandler,
    webHandler,
  })

  return { handler, log, publikaceHandler, webHandler }
}

describe('createHostHandler', () => {
  test('serves a fingerprinted asset with a year-long immutable cache', async () => {
    const { handler, webHandler } = setUp()

    const response = await handler(
      new Request(`${ORIGIN}/assets/entry-abc123.js`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(webHandler).not.toHaveBeenCalled()
  })

  test('serves the rest of the client build to revalidate', async () => {
    const { handler } = setUp()

    const response = await handler(new Request(`${ORIGIN}/favicon.ico`))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0')
  })

  test('hands every other request to the web app and logs it', async () => {
    const { handler, log, webHandler } = setUp()

    const response = await handler(new Request(`${ORIGIN}/articles`))

    expect(await response.text()).toBe('web')
    expect(webHandler).toHaveBeenCalledOnce()
    expect(log).toHaveBeenCalledOnce()
    expect(log.mock.lastCall?.[0]).toMatch(/^GET \/articles 200 /)
  })

  test('answers 404 to an unknown host, files included', async () => {
    const { handler, webHandler } = setUp()

    const page = await handler(new Request(`${UNKNOWN_ORIGIN}/articles`))
    const file = await handler(
      new Request(`${UNKNOWN_ORIGIN}/assets/entry-abc123.js`),
    )

    expect(page.status).toBe(404)
    expect(file.status).toBe(404)
    expect(webHandler).not.toHaveBeenCalled()
  })

  test('hands /health to the web app on any host', async () => {
    const { handler, webHandler } = setUp()

    await handler(new Request(`${UNKNOWN_ORIGIN}/health`))

    expect(webHandler).toHaveBeenCalledOnce()
  })

  test('keeps the query, where links carry their token, out of the log', async () => {
    const { handler, log } = setUp()

    await handler(
      new Request(
        `${ORIGIN}/administration/sign-in/magic-link/verify?token=secret`,
      ),
    )

    expect(log.mock.lastCall?.[0]).not.toContain('secret')
  })

  test('does not log a static file', async () => {
    const { handler, log } = setUp()

    await handler(new Request(`${ORIGIN}/favicon.ico`))

    expect(log).not.toHaveBeenCalled()
  })

  test('hands a POST to an asset path to the web app', async () => {
    const { handler, webHandler } = setUp()

    await handler(
      new Request(`${ORIGIN}/assets/entry-abc123.js`, { method: 'POST' }),
    )

    expect(webHandler).toHaveBeenCalledOnce()
  })

  test('hands a missing asset to the web app', async () => {
    const { handler, webHandler } = setUp()

    await handler(new Request(`${ORIGIN}/assets/missing.js`))

    expect(webHandler).toHaveBeenCalledOnce()
  })

  test('compresses with Brotli when the client accepts it', async () => {
    const { handler } = setUp()

    const response = await handler(
      new Request(`${ORIGIN}/assets/entry-abc123.js`, {
        headers: { 'Accept-Encoding': 'gzip, br' },
      }),
    )

    expect(response.headers.get('Content-Encoding')).toBe('br')
    expect(response.headers.get('Vary')).toMatch(/Accept-Encoding/i)
  })

  test('adds the charset Express added to the web app’s responses', async () => {
    const { handler } = setUp()

    const response = await handler(new Request(`${ORIGIN}/articles`))

    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    )
  })

  test('hands a request for Publikace to Publikace as it came', async () => {
    const { handler, log, publikaceHandler, webHandler } = setUp()
    const request = new Request(`${PUBLIKACE_ORIGIN}/assets/entry-abc123.js`, {
      headers: { 'Accept-Encoding': 'br' },
    })

    const response = await handler(request)

    expect(await response.text()).toBe('publikace')
    expect(response.headers.get('Content-Encoding')).toBeNull()
    expect(publikaceHandler).toHaveBeenCalledWith(request)
    expect(webHandler).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  test('answers 404 to Publikace’s hosts when it is not served', async () => {
    const webHandler = vi.fn(async () => new Response('web'))
    const handler = createHostHandler({ clientDirectory, webHandler })

    const response = await handler(new Request(`${PUBLIKACE_ORIGIN}/sign-in`))

    expect(response.status).toBe(404)
    expect(webHandler).not.toHaveBeenCalled()
  })
})

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { createHostHandler } from './create-host-handler.ts'

const ORIGIN = 'http://vednemesicnik.test'
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
  const log = vi.fn()
  const handler = createHostHandler({ clientDirectory, log, webHandler })

  return { handler, log, webHandler }
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
})

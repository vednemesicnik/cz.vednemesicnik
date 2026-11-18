import * as assert from 'remix/assert'
import { createRouter } from 'remix/router'
import { describe, it } from 'remix/test'

import { logRequests, withoutLinkKey } from './public-link.server.ts'

const KEY = 'k7Qm2xR4pT9a'

/** A router with the request log and nothing else; a path ending in `/missing` answers 404. */
function loggedRouter() {
  let lines: string[] = []
  let router = createRouter({
    middleware: [
      logRequests({ colors: false, log: (line) => lines.push(line) }),
      (context) =>
        new Response('ok', { status: context.url.pathname.endsWith('/missing') ? 404 : 200 }),
    ],
  })
  return { lines, router }
}

describe('withoutLinkKey', () => {
  it('replaces the key and keeps the rest of the path', () => {
    assert.equal(withoutLinkKey(`/l/${KEY}/article`), '/l/…/article')
    assert.equal(
      withoutLinkKey(`/l/${KEY}/artworks/files/7/remove`),
      '/l/…/artworks/files/7/remove',
    )
    assert.equal(withoutLinkKey(`/l/${KEY}`), '/l/…')
  })

  it('leaves a path outside /l/ alone', () => {
    assert.equal(withoutLinkKey('/issues/2026-01'), '/issues/2026-01')
  })
})

describe('logRequests', () => {
  it('logs a shared link’s page without its key', async () => {
    let { lines, router } = loggedRouter()
    await router.fetch(`http://localhost/l/${KEY}/article`)
    assert.equal(lines.length, 1)
    assert.match(lines[0]!, /^\[.+\] GET \/l\/…\/article 200 /)
    assert.equal(lines[0]!.includes(KEY), false)
  })

  it('leaves the key out of a send and of a refusal', async () => {
    let { lines, router } = loggedRouter()
    await router.fetch(`http://localhost/l/${KEY}/artworks/files/7/remove`, { method: 'POST' })
    await router.fetch(`http://localhost/l/${KEY}/missing`)
    assert.match(lines[0]!, / POST \/l\/…\/artworks\/files\/7\/remove 200 /)
    assert.match(lines[1]!, / GET \/l\/…\/missing 404 /)
    assert.equal(
      lines.some((line) => line.includes(KEY)),
      false,
    )
  })

  it('logs every other path as it is, the query included', async () => {
    let { lines, router } = loggedRouter()
    await router.fetch('http://localhost/issues/2026-01?state=all')
    assert.match(lines[0]!, / GET \/issues\/2026-01\?state=all 200 /)
  })
})

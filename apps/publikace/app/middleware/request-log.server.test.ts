import * as assert from 'remix/assert'
import { createRouter } from 'remix/router'
import { describe, it } from 'remix/test'

import { logRequests } from './request-log.server.ts'

const KEY = 'k7Qm2xR4pT9a'
const CODE = '4/0AfakeAuthorisationCode'
const STATE = 'fakeStateS7fQ2'

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

  it('logs the sign-in callback without its code and state', async () => {
    let { lines, router } = loggedRouter()
    await router.fetch(`http://localhost/sign-in/google/callback?state=${STATE}&code=${CODE}`)
    assert.equal(lines.length, 1)
    assert.match(lines[0]!, /^\[.+\] GET \/sign-in\/google\/callback 200 /)
    assert.equal(/[?]|code|state|fake/.test(lines[0]!), false)
  })

  it('logs the account connection’s callback without its code and state', async () => {
    let { lines, router } = loggedRouter()
    await router.fetch(`http://localhost/settings/account/callback?state=${STATE}&code=${CODE}`)
    assert.equal(lines.length, 1)
    assert.match(lines[0]!, /^\[.+\] GET \/settings\/account\/callback 200 /)
    assert.equal(/[?]|code|state|fake/.test(lines[0]!), false)
  })
})

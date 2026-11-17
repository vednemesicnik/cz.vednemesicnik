import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createMembershipCheck } from './group-membership.server.ts'

const ENDPOINT = { secret: 'test-secret', url: 'https://script.example/exec' }

/** A service that answers with `body`, recording what it was sent. */
function serviceAnswering(body: unknown, status = 200) {
  let requests: { init: RequestInit | undefined; url: string }[] = []
  let send = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ init, url: String(url) })
    return new Response(JSON.stringify(body), { status })
  }) as typeof fetch

  return { requests, send }
}

describe('membership check', () => {
  it('sends the address, the group and the secret in a plain-text body', async () => {
    let service = serviceAnswering({ displayName: 'Eva Malá', isMember: true, ok: true })
    let answer = await createMembershipCheck(ENDPOINT, { fetch: service.send })(
      'eva@priklad.cz',
      'vybor@priklad.cz',
    )

    assert.deepEqual(answer, { displayName: 'Eva Malá', status: 'member' })
    let [request] = service.requests
    assert.equal(request?.url, ENDPOINT.url)
    assert.equal(request?.init?.method, 'POST')
    assert.equal(request?.init?.redirect, 'follow')
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      email: 'eva@priklad.cz',
      group: 'vybor@priklad.cz',
      secret: 'test-secret',
    })
  })

  it('tells a group the service does not know from a service that cannot answer', async (t) => {
    t.mock.method(console, 'error', () => {})
    let check = (body: unknown, status?: number) =>
      createMembershipCheck(ENDPOINT, { fetch: serviceAnswering(body, status).send })(
        'eva@priklad.cz',
        'vybor@priklad.cz',
      )

    assert.deepEqual(await check({ isMember: false, ok: true }), { status: 'not-member' })
    assert.deepEqual(await check({ error: 'unknown_group', ok: false }), {
      status: 'unknown-group',
    })
    assert.deepEqual(await check({ error: 'unauthorized', ok: false }), { status: 'unavailable' })
    assert.deepEqual(await check({}, 500), { status: 'unavailable' })
  })

  it('answers unavailable instead of throwing when the request fails', async () => {
    let failing = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof fetch

    let answer = await createMembershipCheck(ENDPOINT, { fetch: failing })(
      'eva@priklad.cz',
      'vybor@priklad.cz',
    )
    assert.deepEqual(answer, { status: 'unavailable' })
  })
})

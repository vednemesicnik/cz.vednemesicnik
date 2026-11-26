import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  createMembershipCheck,
  type MembershipAnswer,
  rememberGroupNames,
} from './group-membership.server.ts'

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
      'eva@vednemesicnik.test',
      'vybor@vednemesicnik.test',
    )

    assert.deepEqual(answer, { displayName: 'Eva Malá', groupName: null, status: 'member' })
    let [request] = service.requests
    assert.equal(request?.url, ENDPOINT.url)
    assert.equal(request?.init?.method, 'POST')
    assert.equal(request?.init?.redirect, 'follow')
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      email: 'eva@vednemesicnik.test',
      group: 'vybor@vednemesicnik.test',
      secret: 'test-secret',
    })
  })

  it('tells a group the service does not know from a service that cannot answer', async (t) => {
    t.mock.method(console, 'error', () => {})
    let check = (body: unknown, status?: number) =>
      createMembershipCheck(ENDPOINT, { fetch: serviceAnswering(body, status).send })(
        'eva@vednemesicnik.test',
        'vybor@vednemesicnik.test',
      )

    assert.deepEqual(await check({ isMember: false, ok: true }), {
      groupName: null,
      status: 'not-member',
    })
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
      'eva@vednemesicnik.test',
      'vybor@vednemesicnik.test',
    )
    assert.deepEqual(answer, { status: 'unavailable' })
  })
})

describe('the group name in the answer', () => {
  let check = (body: unknown) =>
    createMembershipCheck(ENDPOINT, { fetch: serviceAnswering(body).send })(
      'eva@vednemesicnik.test',
      'vybor@vednemesicnik.test',
    )

  it('reads the name on a yes and on a no', async () => {
    assert.deepEqual(await check({ groupName: 'Výbor redakce', isMember: true, ok: true }), {
      displayName: null,
      groupName: 'Výbor redakce',
      status: 'member',
    })
    assert.deepEqual(await check({ groupName: 'Výbor redakce', isMember: false, ok: true }), {
      groupName: 'Výbor redakce',
      status: 'not-member',
    })
  })

  it('takes an empty or a non-text name for no name', async () => {
    for (let groupName of ['', 42, null]) {
      assert.deepEqual(await check({ groupName, isMember: false, ok: true }), {
        groupName: null,
        status: 'not-member',
      })
    }
  })
})

describe('remembering group names', () => {
  function recorder() {
    let recorded: [string, string][] = []
    return {
      record: async (group: string, name: string) => {
        recorded.push([group, name])
      },
      recorded,
    }
  }

  let answering = (answer: MembershipAnswer) => async () => answer

  it('hands a name on with its group and returns the answer as it came', async () => {
    let { record, recorded } = recorder()
    let answer: MembershipAnswer = { groupName: 'Výbor redakce', status: 'not-member' }

    let checked = await rememberGroupNames(answering(answer), record)(
      'eva@vednemesicnik.test',
      'vybor@vednemesicnik.test',
    )

    assert.deepEqual(checked, answer)
    assert.deepEqual(recorded, [['vybor@vednemesicnik.test', 'Výbor redakce']])
  })

  it('records nothing without a name or without an answer', async () => {
    let { record, recorded } = recorder()
    let answers: MembershipAnswer[] = [
      { displayName: null, groupName: null, status: 'member' },
      { status: 'unavailable' },
      { status: 'unknown-group' },
    ]

    for (let answer of answers) {
      await rememberGroupNames(answering(answer), record)(
        'eva@vednemesicnik.test',
        'vybor@vednemesicnik.test',
      )
    }

    assert.deepEqual(recorded, [])
  })

  it('keeps the answer when the name cannot be recorded', async (t) => {
    t.mock.method(console, 'error', () => {})
    let answer: MembershipAnswer = { displayName: null, groupName: 'Výbor', status: 'member' }

    let checked = await rememberGroupNames(answering(answer), async () => {
      throw new Error('database is locked')
    })('eva@vednemesicnik.test', 'vybor@vednemesicnik.test')

    assert.deepEqual(checked, answer)
  })
})

import { generateKeyPairSync, sign } from 'node:crypto'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  createIdentityTokenVerifier,
  GOOGLE_CERTS_URL,
  type TokenAudiences,
} from './identity-token.server.ts'

const NOW = 1_795_100_000

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const OTHER = generateKeyPairSync('rsa', { modulusLength: 2048 })

function jwk(kid: string, key = publicKey) {
  return { ...key.export({ format: 'jwk' }), alg: 'RS256', kid, use: 'sig' }
}

function part(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function token(
  claims: Record<string, unknown> = {},
  options: { alg?: string; key?: typeof privateKey; kid?: string } = {},
): string {
  let head = part({ alg: options.alg ?? 'RS256', kid: options.kid ?? 'k1', typ: 'JWT' })
  let body = part({
    aud: 'script-client',
    email: 'Jakub.Novak@vednemesicnik.test',
    email_verified: true,
    exp: NOW + 600,
    hd: 'Vednemesicnik.test',
    iat: NOW - 10,
    iss: 'https://accounts.google.com',
    name: 'Jakub Novák',
    ...claims,
  })
  let signature = sign('RSA-SHA256', Buffer.from(`${head}.${body}`), options.key ?? privateKey)
  return `${head}.${body}.${signature.toString('base64url')}`
}

/** Google's keys as `keys` names them, counting the fetches. */
function certs(...keys: unknown[]) {
  let calls = { count: 0 }
  let fetch = (async (url: string | URL | Request) => {
    calls.count += 1
    assert.equal(String(url), GOOGLE_CERTS_URL)
    return new Response(JSON.stringify({ keys }), {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  }) as typeof globalThis.fetch
  return { calls, fetch }
}

function verifier(
  fetch: typeof globalThis.fetch,
  audiences: TokenAudiences = 'any',
  now: () => number = () => NOW,
) {
  return createIdentityTokenVerifier({ audiences, fetch, now })
}

describe('the identity token of a background job', () => {
  it('vouches for the address, lower-cased, and the name', async () => {
    let check = await verifier(certs(jwk('k1')).fetch)(token())
    assert.deepEqual(check, {
      identity: {
        email: 'jakub.novak@vednemesicnik.test',
        hostedDomain: 'vednemesicnik.test',
        name: 'Jakub Novák',
      },
      status: 'verified',
    })
  })

  it('takes a token without a name, which a script without the profile scope sends', async () => {
    let check = await verifier(certs(jwk('k1')).fetch)(token({ hd: undefined, name: undefined }))
    assert.deepEqual(check, {
      identity: { email: 'jakub.novak@vednemesicnik.test', hostedDomain: null, name: null },
      status: 'verified',
    })
  })

  it('refuses a token that is not Google’s or has no verified address', async () => {
    let verify = verifier(certs(jwk('k1')).fetch)
    let refused = { status: 'refused' }

    assert.deepEqual(await verify(token({}, { key: OTHER.privateKey })), refused)
    assert.deepEqual(await verify(token({ iss: 'https://evil.external.test' })), refused)
    assert.deepEqual(await verify(token({ exp: undefined })), refused)
    assert.deepEqual(await verify(token({ iat: NOW + 600 })), refused)
    assert.deepEqual(await verify(token({ email_verified: false })), refused)
    assert.deepEqual(await verify(token({ email: '' })), refused)
    assert.deepEqual(await verify(token({}, { alg: 'HS256' })), refused)
    assert.deepEqual(await verify('not.a-token'), refused)
    assert.deepEqual(await verify(''), refused)
  })

  it("accepts a token within the clocks' skew of its expiry, and refuses one past it", async () => {
    let verify = verifier(certs(jwk('k1')).fetch, ['script-client'])

    assert.equal((await verify(token({ exp: NOW - 30 }))).status, 'verified')
    assert.deepEqual(await verify(token({ exp: NOW - 120 })), { status: 'refused' })
  })

  it('checks the audience against the list, takes any only when told to, and none from an empty list', async () => {
    let keys = certs(jwk('k1'))
    assert.equal((await verifier(keys.fetch, ['script-client'])(token())).status, 'verified')
    assert.equal(
      (await verifier(keys.fetch, ['script-client'])(token({ aud: ['other', 'script-client'] })))
        .status,
      'verified',
    )
    assert.equal((await verifier(keys.fetch, ['another-client'])(token())).status, 'refused')
    assert.equal((await verifier(keys.fetch, [])(token())).status, 'refused')
    assert.equal((await verifier(keys.fetch, 'any')(token({ aud: 'anything' }))).status, 'verified')
  })

  it('keeps the keys, and fetches them again for an unknown key at most once a minute', async () => {
    let keys = certs(jwk('k1'), jwk('k2', OTHER.publicKey))
    let clock = NOW
    let verify = verifier(keys.fetch, 'any', () => clock)

    await verify(token())
    await verify(token())
    assert.equal((await verify(token({}, { key: OTHER.privateKey, kid: 'k2' }))).status, 'verified')
    assert.equal(keys.calls.count, 1)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal((await verify(token({}, { kid: `k-made-up-${attempt}` }))).status, 'refused')
    }
    assert.equal(keys.calls.count, 1)

    clock = NOW + 61
    assert.equal(
      (await verify(token({ exp: clock + 600 }, { kid: 'k-unknown' }))).status,
      'refused',
    )
    assert.equal(keys.calls.count, 2)
  })

  it('shares one fetch among calls that arrive while it runs', async () => {
    let keys = certs(jwk('k1'))
    let verify = verifier(keys.fetch)
    let checks = await Promise.all([verify(token()), verify(token()), verify(token())])
    assert.ok(checks.every((check) => check.status === 'verified'))
    assert.equal(keys.calls.count, 1)
  })

  it('answers unavailable, never refused, when Google’s keys are out of reach', async (t) => {
    t.mock.method(console, 'error', () => {})
    let failing = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof globalThis.fetch
    assert.deepEqual(await verifier(failing)(token()), { status: 'unavailable' })
  })
})

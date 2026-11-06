import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { verifyActivityToken } from './verify-activity-token.server'

const SECRET = 'test-link-secret'
const NOW = Date.parse('2026-11-10T12:00:00Z')
// The start of 24 Nov 2026 in Prague, as the script sets it.
const EXP = Date.parse('2026-11-23T23:00:00Z') / 1000

const encode = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')

const sign = (encoded: string, secret = SECRET) =>
  `${encoded}.${createHmac('sha256', secret).update(encoded).digest('hex')}`

const tokenFor = (payload: unknown) => sign(encode(payload))

const PAYLOAD = { action: 'confirmActive', email: 'anna@local.dev', exp: EXP }

const replaceAt = (text: string, index: number) =>
  `${text.slice(0, index)}${text[index] === 'a' ? 'b' : 'a'}${text.slice(index + 1)}`

describe('verifyActivityToken', () => {
  it('accepts a token the script signed', () => {
    expect(verifyActivityToken(tokenFor(PAYLOAD), SECRET, NOW)).toEqual({
      action: 'confirmActive',
      email: 'anna@local.dev',
      expiresAt: new Date(EXP * 1000),
      status: 'valid',
    })
  })

  it.each(['leave', 'reactivate'])('accepts the action %s', (action) => {
    expect(
      verifyActivityToken(tokenFor({ ...PAYLOAD, action }), SECRET, NOW),
    ).toMatchObject({ action, status: 'valid' })
  })

  it('accepts the encoded part with or without padding', () => {
    // One of three address lengths leaves the JSON's byte count off a multiple of three.
    const payload = ['a', 'ab', 'abc']
      .map((name) => ({ ...PAYLOAD, email: `${name}@local.dev` }))
      .find((candidate) => JSON.stringify(candidate).length % 3 !== 0)
    const unpadded = encode(payload)
    const padded = `${unpadded}${'='.repeat((4 - (unpadded.length % 4)) % 4)}`

    expect(padded).not.toBe(unpadded)
    expect(verifyActivityToken(sign(unpadded), SECRET, NOW).status).toBe(
      'valid',
    )
    expect(verifyActivityToken(sign(padded), SECRET, NOW).status).toBe('valid')
  })

  it('rejects one changed character in the payload', () => {
    const token = tokenFor(PAYLOAD)

    expect(verifyActivityToken(replaceAt(token, 5), SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it('rejects one changed character in the signature', () => {
    const token = tokenFor(PAYLOAD)

    expect(
      verifyActivityToken(replaceAt(token, token.length - 1), SECRET, NOW),
    ).toEqual({ status: 'invalid' })
  })

  it('rejects a token signed with another secret', () => {
    const token = sign(encode(PAYLOAD), 'another-secret')

    expect(verifyActivityToken(token, SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it('rejects a later expiry written over a signed token', () => {
    const [, signature] = tokenFor(PAYLOAD).split('.')
    const forged = `${encode({ ...PAYLOAD, exp: EXP + 365 * 24 * 60 * 60 })}.${signature}`

    expect(verifyActivityToken(forged, SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it('rejects everything when the secret is empty', () => {
    const token = sign(encode(PAYLOAD), '')

    expect(verifyActivityToken(token, '', NOW)).toEqual({ status: 'invalid' })
  })

  it.each([
    ['no separator', 'abc'],
    ['an empty token', ''],
    ['an upper-case signature', tokenFor(PAYLOAD).toUpperCase()],
    ['a short signature', `${encode(PAYLOAD)}.abc`],
    ['a token past the length cap', sign('a'.repeat(1100))],
  ])('rejects %s', (_label, token) => {
    expect(verifyActivityToken(token, SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it('rejects a signed payload that is not JSON', () => {
    const encoded = Buffer.from('not json', 'utf8').toString('base64url')

    expect(verifyActivityToken(sign(encoded), SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it.each([
    ['an unknown action', { ...PAYLOAD, action: 'requestDeparture' }],
    ['a missing address', { action: 'leave', exp: EXP }],
    ['a fractional expiry', { ...PAYLOAD, exp: EXP + 0.5 }],
    ['an extra field', { ...PAYLOAD, name: 'Anna' }],
  ])('rejects a signed payload with %s', (_label, payload) => {
    expect(verifyActivityToken(tokenFor(payload), SECRET, NOW)).toEqual({
      status: 'invalid',
    })
  })

  it('says an expired link carried which action and until when, without the address', () => {
    expect(verifyActivityToken(tokenFor(PAYLOAD), SECRET, EXP * 1000)).toEqual({
      action: 'confirmActive',
      expiresAt: new Date(EXP * 1000),
      status: 'expired',
    })
  })

  it('verifies a token as the script builds it', () => {
    // From the Node run of the script's own code with LINK_SECRET "link-secret".
    const token =
      'eyJlbWFpbCI6ImFubmFAeC5jeiIsImFjdGlvbiI6ImNvbmZpcm1BY3RpdmUiLCJleHAiOjE3OTU0NzQ4MDB9.95121bd53a61b15a3c1c9d9f54964c91e03ef123d2a59839c60cea2bcf1162e9'

    expect(verifyActivityToken(token, 'link-secret', NOW)).toEqual({
      action: 'confirmActive',
      email: 'anna@x.cz',
      expiresAt: new Date(1795474800 * 1000),
      status: 'valid',
    })
  })
})

import { createHmac } from 'node:crypto'

import { describe, expect, test, vi } from 'vitest'

import { signGasRequest } from './sign-gas-request.server'

const secret = 'test-secret'

describe('signGasRequest', () => {
  test('carries only the envelope fields, never the secret', () => {
    const envelope = signGasRequest(secret, { email: 'a@x.test' })

    expect(Object.keys(envelope).sort()).toEqual([
      'payload',
      'signature',
      'timestamp',
    ])
    expect(JSON.stringify(envelope)).not.toContain(secret)
  })

  test('signs the payload as the exact string that travels', () => {
    const envelope = signGasRequest(secret, {
      email: 'a@x.test',
      link: 'https://x.test',
    })

    // Re-deriving from `envelope.payload` rather than from the original object is
    // the point: the far side only ever sees this string, and verifies against it.
    const expected = createHmac('sha256', secret)
      .update(`${envelope.timestamp}.${envelope.payload}`)
      .digest('hex')

    expect(envelope.signature).toBe(expected)
    expect(JSON.parse(envelope.payload)).toEqual({
      email: 'a@x.test',
      link: 'https://x.test',
    })
  })

  test('a payload edited in flight no longer matches the signature', () => {
    const envelope = signGasRequest(secret, { email: 'a@x.test' })
    const tampered = envelope.payload.replace('a@x.test', 'attacker@x.test')

    const recomputed = createHmac('sha256', secret)
      .update(`${envelope.timestamp}.${tampered}`)
      .digest('hex')

    expect(recomputed).not.toBe(envelope.signature)
  })

  test('the timestamp is inside the signature, so it cannot be moved', () => {
    const envelope = signGasRequest(secret, { email: 'a@x.test' })

    const withLaterTimestamp = createHmac('sha256', secret)
      .update(`${envelope.timestamp + 600}.${envelope.payload}`)
      .digest('hex')

    expect(withLaterTimestamp).not.toBe(envelope.signature)
  })

  test('stamps a fresh timestamp per call, in Unix seconds', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-07-31T09:00:00Z'))
      const first = signGasRequest(secret, { email: 'a@x.test' })
      expect(first.timestamp).toBe(
        Math.floor(Date.parse('2026-07-31T09:00:00Z') / 1000),
      )

      vi.setSystemTime(new Date('2026-07-31T09:01:00Z'))
      const second = signGasRequest(secret, { email: 'a@x.test' })

      // Same request, different envelope — which is exactly why freshness alone does
      // not make a retry safe, and why writes carry an idempotency key instead.
      expect(second.timestamp).toBe(first.timestamp + 60)
      expect(second.signature).not.toBe(first.signature)
    } finally {
      vi.useRealTimers()
    }
  })
})

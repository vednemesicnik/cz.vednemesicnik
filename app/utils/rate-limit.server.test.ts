import { RouterContextProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createRateLimitMiddleware,
  getClientIp,
  rateLimitContext,
} from './rate-limit.server'

const EDGE = '162.158.0.1'
const CLIENT = '198.51.100.1'
const SECRET = 'origin-secret'

const requestWith = (headers: Record<string, string>) =>
  new Request('http://localhost/', { headers })

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_ORIGIN_SECRET', SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getClientIp', () => {
  it.each([
    ['IPv4', CLIENT],
    ['IPv6', '2001:db8::1'],
  ])('takes an %s client from a request of our zone', (_, address) => {
    const request = requestWith({
      'CF-Connecting-IP': address,
      'Fly-Client-IP': EDGE,
      'X-Origin-Secret': SECRET,
    })

    expect(getClientIp(request)).toBe(address)
  })

  it.each([
    ['a direct hit', {}],
    ['a wrong secret', { 'X-Origin-Secret': 'guess' }],
    ['a secret of another length', { 'X-Origin-Secret': `${SECRET}x` }],
    ['an empty secret', { 'X-Origin-Secret': '' }],
  ])('ignores CF-Connecting-IP on %s, even from an edge', (_, headers) => {
    const request = requestWith({
      ...headers,
      'CF-Connecting-IP': '203.0.113.1',
      'Fly-Client-IP': EDGE,
    })

    expect(getClientIp(request)).toBe(EDGE)
  })

  it.each([undefined, ''])(
    'ignores CF-Connecting-IP while the secret is %j, whatever is sent',
    (configured) => {
      vi.stubEnv('CLOUDFLARE_ORIGIN_SECRET', configured)
      const request = requestWith({
        'CF-Connecting-IP': '203.0.113.1',
        'Fly-Client-IP': EDGE,
        'X-Origin-Secret': '',
      })

      expect(getClientIp(request)).toBe(EDGE)
    },
  )

  it.each([
    ['missing', {}],
    ['malformed', { 'CF-Connecting-IP': 'not-an-address' }],
    ['a list', { 'CF-Connecting-IP': `${CLIENT}, ${EDGE}` }],
  ])('falls back to the edge when CF-Connecting-IP is %s', (_, headers) => {
    const request = requestWith({
      ...headers,
      'Fly-Client-IP': EDGE,
      'X-Origin-Secret': SECRET,
    })

    expect(getClientIp(request)).toBe(EDGE)
  })

  it('trusts no header without Fly-Client-IP in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const request = requestWith({
      'CF-Connecting-IP': CLIENT,
      'X-Forwarded-For': CLIENT,
      'X-Origin-Secret': SECRET,
    })

    expect(getClientIp(request)).toBe('unknown')
  })

  it('falls back to X-Forwarded-For outside production', () => {
    const request = requestWith({
      'CF-Connecting-IP': '203.0.113.1',
      'X-Forwarded-For': `${CLIENT}, ${EDGE}`,
    })

    expect(getClientIp(request)).toBe(CLIENT)
  })
})

const run = async (method: string) => {
  const store = {
    hit: vi.fn(() => ({
      limit: 1,
      ok: false,
      remaining: 0,
      resetAt: Date.now(),
    })),
  }
  const middleware = createRateLimitMiddleware({
    key: 'test',
    limit: 1,
    store,
    windowMs: 1000,
  })
  const context = new RouterContextProvider()

  await middleware(
    {
      context,
      params: {},
      request: new Request('http://localhost/', { method }),
      unstable_pattern: '/',
    } as unknown as Parameters<typeof middleware>[0],
    async () => new Response(),
  )

  return { limited: context.get(rateLimitContext), store }
}

describe('createRateLimitMiddleware', () => {
  it.each(['GET', 'HEAD'])('leaves %s alone', async (method) => {
    const { limited, store } = await run(method)

    expect(store.hit).not.toHaveBeenCalled()
    expect(limited).toBeNull()
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'counts %s, which reaches the action',
    async (method) => {
      const { limited, store } = await run(method)

      expect(store.hit).toHaveBeenCalledOnce()
      expect(limited).not.toBeNull()
    },
  )

  it('counts the client, and one IPv6 /64 as one client', async () => {
    const hitsFor = async (address: string) => {
      const store = {
        hit: vi.fn((_key: string) => ({
          limit: 1,
          ok: true,
          remaining: 0,
          resetAt: Date.now(),
        })),
      }
      const middleware = createRateLimitMiddleware({
        key: 'test',
        limit: 1,
        store,
        windowMs: 1000,
      })

      await middleware(
        {
          context: new RouterContextProvider(),
          params: {},
          request: new Request('http://localhost/', {
            headers: {
              'CF-Connecting-IP': address,
              'Fly-Client-IP': EDGE,
              'X-Origin-Secret': SECRET,
            },
            method: 'POST',
          }),
          unstable_pattern: '/',
        } as unknown as Parameters<typeof middleware>[0],
        async () => new Response(),
      )

      return store.hit.mock.lastCall?.[0]
    }

    expect(await hitsFor(CLIENT)).toBe(`test:${CLIENT}`)
    expect(await hitsFor('2001:db8:83a0:1234::1')).toBe(
      'test:2001:db8:83a0:1234::/64',
    )
    expect(await hitsFor('2001:db8:83a0:1234:ffff::2')).toBe(
      'test:2001:db8:83a0:1234::/64',
    )
  })
})

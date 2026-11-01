import { RouterContextProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import {
  createRateLimitMiddleware,
  rateLimitContext,
} from './rate-limit.server'

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
})

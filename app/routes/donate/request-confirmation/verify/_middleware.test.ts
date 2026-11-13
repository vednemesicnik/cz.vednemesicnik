import { RouterContextProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { rateLimitContext } from '~/utils/rate-limit.server'

import { middleware } from './_middleware'

// The store is shared and lives as long as the process: every test takes its own IP.
let ipCounter = 0

const countAllowed = async (query: string, attempts: number) => {
  const ip = `10.3.0.${++ipCounter}`
  let allowed = 0

  for (let attempt = 0; attempt < attempts; attempt++) {
    const context = new RouterContextProvider()
    await middleware[0](
      {
        context,
        params: {},
        request: new Request(
          `http://localhost/donate/request-confirmation/verify${query}`,
          { headers: { 'X-Forwarded-For': ip }, method: 'POST' },
        ),
      } as never,
      async () => new Response(null),
    )
    if (context.get(rateLimitContext) === null) allowed++
  }

  return allowed
}

describe('donation request verify middleware', () => {
  it('lets 20 code tries and new submits an hour through', async () => {
    expect(await countAllowed('?intent=verify-code', 25)).toBe(20)
    expect(await countAllowed('?intent=submit', 25)).toBe(20)
  })

  it('leaves sending a code to the action', async () => {
    expect(await countAllowed('?intent=send-code', 25)).toBe(25)
  })
})

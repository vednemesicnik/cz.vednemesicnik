import { RouterContextProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { rateLimitContext } from '~/utils/rate-limit.server'

import { middleware } from './_middleware'

// The store is shared and lives as long as the process: every test takes its own IP.
let ipCounter = 0

// How many POSTs from one IP pass before the next one is limited.
const countAllowed = async (stepAndQuery: string, attempts: number) => {
  const ip = `10.1.0.${++ipCounter}`
  let allowed = 0

  for (let attempt = 0; attempt < attempts; attempt++) {
    const context = new RouterContextProvider()
    await middleware[0](
      {
        context,
        params: { stepName: stepAndQuery.split('?')[0] },
        request: new Request(
          `http://localhost/organization/membership/application/${stepAndQuery}`,
          { headers: { 'X-Forwarded-For': ip }, method: 'POST' },
        ),
      } as never,
      async () => new Response(null),
    )
    if (context.get(rateLimitContext) === null) allowed++
  }

  return allowed
}

describe('membership application middleware', () => {
  it('lets 3 submits an hour through', async () => {
    expect(await countAllowed('signature', 5)).toBe(3)
  })

  it('lets 20 code tries an hour through, apart from the submits', async () => {
    expect(await countAllowed('signature?intent=verify-code', 25)).toBe(20)
  })

  it('leaves sending a code and saving the details to the action', async () => {
    expect(await countAllowed('signature?intent=send-code', 25)).toBe(25)
    expect(await countAllowed('details', 25)).toBe(25)
  })
})

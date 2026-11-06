import { describe, expect, it } from 'vitest'

import { middleware } from './_middleware'

type Next = () => Promise<Response>

const run = (next: Next) =>
  (
    middleware[0] as unknown as (args: unknown, next: Next) => Promise<Response>
  )({}, next)

const expectTokenHeaders = (headers: Headers) => {
  expect(headers.get('Cache-Control')).toBe('private, no-store, no-transform')
  expect(headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
}

describe('activity confirmation middleware', () => {
  it('marks an answer, the error page included', async () => {
    const response = await run(async () => new Response('', { status: 500 }))

    expectTokenHeaders(response.headers)
  })

  it('replaces a weaker Cache-Control', async () => {
    const response = await run(
      async () =>
        new Response('', {
          headers: { 'Cache-Control': 'public, max-age=60' },
        }),
    )

    expectTokenHeaders(response.headers)
  })

  it('marks a thrown response and lets it through', async () => {
    const thrown = await run(async () => {
      throw new Response('', { status: 303 })
    }).catch((error) => error)

    expect(thrown.status).toBe(303)
    expectTokenHeaders(thrown.headers)
  })
})

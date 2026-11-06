import { describe, expect, it, vi } from 'vitest'

// The cookie reads it on import. Without it the cookie is unsigned, and a forged value
// would be refused for its shape instead of its signature.
vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-session-secret'
})

import { writeActivityAnsweredCookie } from '~/utils/editorial-board-activity/write-activity-answered-cookie.server'

import { loader } from './_loader'

const URL_PATH = 'http://localhost/editorial-board/activity/confirm/done'

const run = (cookie?: string) =>
  loader({
    request: new Request(URL_PATH, {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    }),
  } as never)

describe('activity answered loader', () => {
  it.each(['confirmActive', 'leave', 'reactivate'] as const)(
    'opens for whoever just answered %s',
    async (action) => {
      const setCookie = await writeActivityAnsweredCookie(action)

      await expect(run(setCookie.split(';')[0])).resolves.toEqual({ action })
    },
  )

  it.each([
    ['no cookie', undefined],
    [
      'the right value without a signature',
      `vdm_activity_answered=${btoa(JSON.stringify({ action: 'leave' }))}`,
    ],
  ])('sends to the editorial board with %s', async (_case, cookie) => {
    const response = await run(cookie).catch((thrown) => thrown)

    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/editorial-board')
  })
})

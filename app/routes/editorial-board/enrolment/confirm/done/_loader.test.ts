import { describe, expect, it, vi } from 'vitest'

// The cookie reads it on import. Without it the cookie is unsigned, and a forged value
// would be refused for its shape instead of its signature.
vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-session-secret'
})

import { writeEnrolmentConfirmedCookie } from '~/utils/editorial-board-enrolment/write-enrolment-confirmed-cookie.server'

import { loader } from './_loader'

const URL_PATH = 'http://localhost/editorial-board/enrolment/confirm/done'

const run = (cookie?: string) =>
  loader({
    request: new Request(URL_PATH, {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    }),
  } as never)

describe('enrolment confirmed loader', () => {
  it('opens for whoever just confirmed', async () => {
    const setCookie = await writeEnrolmentConfirmedCookie()

    await expect(run(setCookie.split(';')[0])).resolves.toBeNull()
  })

  it.each([
    ['no cookie', undefined],
    [
      'the right value without a signature',
      `vdm_enrolment_confirmed=${btoa(JSON.stringify({ confirmed: true }))}`,
    ],
  ])('sends back to the form with %s', async (_case, cookie) => {
    const response = await run(cookie).catch((thrown) => thrown)

    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/editorial-board/enrolment')
  })
})

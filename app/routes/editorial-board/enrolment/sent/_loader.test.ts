import { describe, expect, it } from 'vitest'

import { writeEnrolmentSentCookie } from '~/utils/editorial-board-enrolment/write-enrolment-sent-cookie.server'

import { loader } from './_loader'

const URL_PATH = 'http://localhost/editorial-board/enrolment/sent'

const run = (cookie?: string) =>
  loader({
    request: new Request(URL_PATH, {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    }),
  } as never)

describe('enrolment sent loader', () => {
  it('names the address from the cookie', async () => {
    const setCookie = await writeEnrolmentSentCookie('tereza@local.dev')

    await expect(run(setCookie.split(';')[0])).resolves.toEqual({
      email: 'tereza@local.dev',
    })
  })

  it.each([
    ['no cookie', undefined],
    ['a forged cookie', 'vdm_enrolment_sent=forged'],
  ])('sends back to the form with %s', async (_case, cookie) => {
    const response = await run(cookie).catch((thrown) => thrown)

    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/editorial-board/enrolment')
  })
})

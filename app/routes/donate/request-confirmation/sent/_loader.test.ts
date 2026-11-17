import { describe, expect, it } from 'vitest'

import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'

import { loader } from './_loader'

const URL = 'http://localhost/donate/request-confirmation/sent'

const load = (cookie?: string, url = URL) =>
  loader({
    request: new Request(url, {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    }),
  } as never).catch((thrown) => thrown)

describe('donation request sent loader', () => {
  it('shows the code and the year from the cookie', async () => {
    const cookie = (
      await writeDonationRequestCookie({
        requestId: '2024-K7M2QX',
        state: 'sent',
      })
    ).split(';')[0]

    await expect(load(cookie)).resolves.toEqual({
      requestId: '2024-K7M2QX',
      year: '2024',
    })
  })

  it('shows nothing from the address and sends a visit without a request to the form', async () => {
    const result = await load(undefined, `${URL}?id=<script>`)

    expect(result).toBeInstanceOf(Response)
    expect(result.headers.get('Location')).toBe('/donate/request-confirmation')
  })
})

import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { DonationRequestState } from './read-donation-request-cookie.server'

const DETAILS_STATE: DonationRequestState = {
  details: {
    accounts: ['123456789/0800'],
    address: { city: 'Praha', street: 'Lannova 12', zip: '11000' },
    dateOfBirth: '01.02.1990',
    email: 'tereza@local.dev',
    firstName: 'Tereza',
    lastName: 'Malá',
    type: 'individual',
    year: '2025',
  },
  requestId: '2025-K7M2QX',
  state: 'details',
  verification: { issuedAt: 1234 },
}

describe('donation request cookie', () => {
  let read: typeof import('./read-donation-request-cookie.server').readDonationRequestCookie
  let write: typeof import('./write-donation-request-cookie.server').writeDonationRequestCookie

  beforeAll(async () => {
    // The cookie reads its secret once, when its module loads.
    vi.stubEnv('SESSION_SECRET', 'test-secret')
    read = (await import('./read-donation-request-cookie.server'))
      .readDonationRequestCookie
    write = (await import('./write-donation-request-cookie.server'))
      .writeDonationRequestCookie
  })

  const requestWith = (cookie: string) =>
    new Request('http://localhost/', { headers: { Cookie: cookie } })

  const cookieValue = (setCookie: string) => setCookie.split(';')[0]

  it('round-trips the details for a week', async () => {
    const setCookie = await write(DETAILS_STATE)

    expect(setCookie).toContain('Max-Age=604800')
    expect(setCookie).toContain('Path=/donate/request-confirmation')
    expect(setCookie).toContain('HttpOnly')
    await expect(read(requestWith(cookieValue(setCookie)))).resolves.toEqual(
      DETAILS_STATE,
    )
  })

  it('round-trips the sent state for an hour', async () => {
    const setCookie = await write({ requestId: '2025-K7M2QX', state: 'sent' })

    expect(setCookie).toContain('Max-Age=3600')
    await expect(read(requestWith(cookieValue(setCookie)))).resolves.toEqual({
      requestId: '2025-K7M2QX',
      state: 'sent',
    })
  })

  it('reads nothing from a missing, foreign or tampered cookie', async () => {
    const setCookie = cookieValue(await write(DETAILS_STATE))
    const [name, value] = setCookie.split('=')

    await expect(read(new Request('http://localhost/'))).resolves.toBeNull()
    await expect(read(requestWith('other=1'))).resolves.toBeNull()
    await expect(
      read(requestWith(`${name}=${value.replace(/.$/, 'x')}`)),
    ).resolves.toBeNull()
  })
})

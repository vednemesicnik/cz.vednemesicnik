import { describe, expect, it, vi } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/email-verification-config'
import type { DonationRequestState } from '~/utils/donation-request/read-donation-request-cookie.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'

import { loader } from './_loader'

// U+00A0, spelled out: in the source it would look like a plain space.
const NO_BREAK_SPACE = String.fromCodePoint(0xa0)
const URL = 'http://localhost/donate/request-confirmation/verify'
const DETAILS = {
  accounts: ['123456789/0800'],
  address: { city: 'Praha', street: 'Lannova 12', zip: '11000' },
  companyName: 'Firma s.r.o.',
  email: 'Firma@local.dev',
  ico: '12345678',
  type: 'entity' as const,
  year: '2025',
}

const load = async (state?: Partial<DonationRequestState>) => {
  const cookie =
    state === undefined
      ? undefined
      : (
          await writeDonationRequestCookie({
            details: DETAILS,
            requestId: '2025-K7M2QX',
            state: 'details',
            ...state,
          } as DonationRequestState)
        ).split(';')[0]

  return loader({
    request: new Request(URL, {
      headers: cookie === undefined ? {} : { Cookie: cookie },
    }),
  } as never).catch((thrown) => thrown)
}

describe('donation request verify loader', () => {
  it('says until when the code works, in Prague time', async () => {
    const issuedAt =
      Date.UTC(2026, 10, 7, 17, 42) - VERIFICATION_CODE_LIFETIME_MILLISECONDS
    vi.useFakeTimers({ now: issuedAt + 1000, toFake: ['Date'] })

    const result = await load({ verification: { issuedAt } }).finally(() =>
      vi.useRealTimers(),
    )

    expect(result.email).toBe('Firma@local.dev')
    expect(result.year).toBe('2025')
    expect(result.verification).toEqual({
      // No break after the day and after the v.
      expiresAt: `7.${NO_BREAK_SPACE}listopadu 2026 v${NO_BREAK_SPACE}18:42`,
      state: 'pending',
    })
  })

  it('takes a saved request without a live code as expired, and a confirmed one as verified', async () => {
    expect((await load({})).verification).toEqual({ state: 'expired' })
    expect(
      (await load({ verifiedEmail: 'firma@local.dev' })).verification,
    ).toEqual({ state: 'verified' })
  })

  it('sends a visit without a request to the form, and a sent one to its page', async () => {
    const missing = await load()
    expect(missing.headers.get('Location')).toBe(
      '/donate/request-confirmation?reason=expired',
    )

    const sent = await load({
      details: undefined,
      state: 'sent',
    } as Partial<DonationRequestState>)
    expect(sent.headers.get('Location')).toBe(
      '/donate/request-confirmation/sent',
    )
  })
})

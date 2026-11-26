import { describe, expect, it, vi } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/membership-application-config'
import { writeMembershipApplicationCookie } from '~/utils/membership-application/write-membership-application-cookie.server'

import { loader } from './_loader'

const URL_SIGNATURE =
  'http://localhost/organization/membership/application/signature'
const DETAILS = {
  address: 'Lannova 12, 370 01 České Budějovice',
  dateOfBirth: '2009-05-14',
  email: 'Tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
}

const loadSignature = async (
  state: Partial<Parameters<typeof writeMembershipApplicationCookie>[0]>,
) => {
  const cookie = (
    await writeMembershipApplicationCookie({
      code: 'VDM-7K3Q-2P',
      details: DETAILS,
      state: 'details',
      ...state,
    } as Parameters<typeof writeMembershipApplicationCookie>[0])
  ).split(';')[0]

  const result = await loader({
    params: { stepName: 'signature' },
    request: new Request(URL_SIGNATURE, { headers: { Cookie: cookie } }),
    url: new URL(URL_SIGNATURE),
  } as never)

  if (result.step !== 'signature')
    throw new Error('Expected the signature step.')
  return result
}

describe('membership application loader, signature step', () => {
  it('says until when the code works, in Prague time with no break after the day and the v', async () => {
    // 17:42 UTC is 18:42 in Prague in November.
    const issuedAt =
      Date.UTC(2026, 10, 7, 17, 42) - VERIFICATION_CODE_LIFETIME_MILLISECONDS
    vi.useFakeTimers({ now: issuedAt + 1000, toFake: ['Date'] })

    const result = await loadSignature({ verification: { issuedAt } }).finally(
      () => vi.useRealTimers(),
    )

    expect(result.verification).toEqual({
      expiresAt: '7. listopadu 2026 v 18:42',
      state: 'pending',
    })
  })

  it('takes a cookie without a code as expired', async () => {
    expect((await loadSignature({})).verification).toEqual({ state: 'expired' })
  })

  it('says verified for the address the code confirmed, without case', async () => {
    const result = await loadSignature({ verifiedEmail: 'tereza@local.dev' })

    expect(result.verification).toEqual({ state: 'verified' })
    expect(result.email).toBe('Tereza@local.dev')
  })

  it('forgets the verification of another address', async () => {
    expect(
      (await loadSignature({ verifiedEmail: 'jan@local.dev' })).verification,
    ).toEqual({ state: 'expired' })
  })
})

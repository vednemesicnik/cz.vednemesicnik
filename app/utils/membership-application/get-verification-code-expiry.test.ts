import { describe, expect, it } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/membership-application-config'

import { getVerificationCodeExpiry } from './get-verification-code-expiry'
import { isEmailVerified } from './is-email-verified'

const ISSUED_AT = Date.UTC(2026, 10, 6, 17, 42)
const APPLICATION = {
  code: 'VDM-7K3Q-2P',
  details: {
    address: 'Lannova 12, 370 01 České Budějovice',
    dateOfBirth: '2009-05-14',
    email: 'Tereza@local.dev',
    firstName: 'Tereza',
    lastName: 'Malá',
  },
  state: 'details' as const,
}

describe('getVerificationCodeExpiry', () => {
  it('answers the expiry while the code is live', () => {
    expect(
      getVerificationCodeExpiry(
        { ...APPLICATION, verification: { issuedAt: ISSUED_AT } },
        ISSUED_AT + 1000,
      ),
    ).toEqual(new Date(ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS))
  })

  it('answers null once it has expired, and without a code', () => {
    expect(
      getVerificationCodeExpiry(
        { ...APPLICATION, verification: { issuedAt: ISSUED_AT } },
        ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS,
      ),
    ).toBeNull()
    expect(getVerificationCodeExpiry(APPLICATION, ISSUED_AT)).toBeNull()
  })
})

describe('isEmailVerified', () => {
  it('takes the details address without case', () => {
    expect(
      isEmailVerified({ ...APPLICATION, verifiedEmail: 'tereza@local.dev' }),
    ).toBe(true)
  })

  it('refuses another address and no verification', () => {
    expect(
      isEmailVerified({ ...APPLICATION, verifiedEmail: 'jan@local.dev' }),
    ).toBe(false)
    expect(isEmailVerified(APPLICATION)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/email-verification-config'

import { getVerificationCodeExpiry } from './get-verification-code-expiry'

const ISSUED_AT = Date.UTC(2026, 10, 6, 17, 42)

describe('getVerificationCodeExpiry', () => {
  it('answers the expiry while the code is live', () => {
    expect(getVerificationCodeExpiry(ISSUED_AT, ISSUED_AT + 1000)).toEqual(
      new Date(ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS),
    )
  })

  it('answers null once it has expired, and without a code', () => {
    expect(
      getVerificationCodeExpiry(
        ISSUED_AT,
        ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS,
      ),
    ).toBeNull()
    expect(getVerificationCodeExpiry(undefined, ISSUED_AT)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/membership-application-config'

import { checkVerificationCode } from './check-verification-code.server'
import { createVerificationCode } from './create-verification-code.server'

const ISSUED_AT = Date.UTC(2026, 10, 6, 17, 42)
const EMAIL = 'tereza@local.dev'
const CODE = createVerificationCode('secret', EMAIL, ISSUED_AT)

const check = (code: string, now = ISSUED_AT + 1000, secret = 'secret') =>
  checkVerificationCode({
    code,
    email: EMAIL,
    issuedAt: ISSUED_AT,
    now,
    secret,
  })

describe('checkVerificationCode', () => {
  it('takes the code from the e-mail', () => {
    expect(check(CODE)).toBe('valid')
  })

  it('takes it in two groups of four and in lower case', () => {
    expect(check(`${CODE.slice(0, 4)} ${CODE.slice(4)}`.toLowerCase())).toBe(
      'valid',
    )
  })

  it('refuses another code, a code of another length and a code of an earlier e-mail', () => {
    expect(check('22222222')).toBe('wrong')
    expect(check(CODE.slice(0, 7))).toBe('wrong')
    expect(
      check(createVerificationCode('secret', EMAIL, ISSUED_AT - 60_000)),
    ).toBe('wrong')
  })

  it('says expired once the lifetime is over, even for the right code', () => {
    expect(
      check(CODE, ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS - 1),
    ).toBe('valid')
    expect(
      check(CODE, ISSUED_AT + VERIFICATION_CODE_LIFETIME_MILLISECONDS),
    ).toBe('expired')
  })

  it('takes no code without a secret', () => {
    expect(check(CODE, ISSUED_AT + 1000, '')).toBe('wrong')
  })
})

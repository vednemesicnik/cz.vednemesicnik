import { describe, expect, it } from 'vitest'

import { VERIFICATION_CODE_ALPHABET } from '~/config/email-verification-config'

import { createVerificationCode } from './create-verification-code.server'

const ISSUED_AT = Date.UTC(2026, 10, 6, 17, 42)

const create = (
  secret: string,
  email: string,
  issuedAt: number,
  purpose: 'donation-verify' | 'membership-verify' = 'membership-verify',
) => createVerificationCode({ email, issuedAt, purpose, secret })

describe('createVerificationCode', () => {
  it('makes eight characters of the code alphabet', () => {
    const code = create('secret', 'tereza@local.dev', ISSUED_AT)

    expect(code).toHaveLength(8)
    expect(
      [...code].every((character) =>
        VERIFICATION_CODE_ALPHABET.includes(character),
      ),
    ).toBe(true)
  })

  it('makes the same code again from the same address and moment', () => {
    expect(create('secret', 'tereza@local.dev', ISSUED_AT)).toBe(
      create('secret', 'tereza@local.dev', ISSUED_AT),
    )
  })

  it('reads the address without case', () => {
    expect(create('secret', 'Tereza@Local.dev', ISSUED_AT)).toBe(
      create('secret', 'tereza@local.dev', ISSUED_AT),
    )
  })

  it('makes another code for another moment, address or secret', () => {
    const code = create('secret', 'tereza@local.dev', ISSUED_AT)

    expect(create('secret', 'tereza@local.dev', ISSUED_AT + 1)).not.toBe(code)
    expect(create('secret', 'jan@local.dev', ISSUED_AT)).not.toBe(code)
    expect(create('other', 'tereza@local.dev', ISSUED_AT)).not.toBe(code)
  })

  it('makes another code for another purpose', () => {
    expect(
      create('secret', 'tereza@local.dev', ISSUED_AT, 'donation-verify'),
    ).not.toBe(
      create('secret', 'tereza@local.dev', ISSUED_AT, 'membership-verify'),
    )
  })

  it('refuses an empty secret', () => {
    expect(() => create('', 'tereza@local.dev', ISSUED_AT)).toThrow()
  })
})

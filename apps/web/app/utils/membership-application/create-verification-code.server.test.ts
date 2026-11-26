import { describe, expect, it } from 'vitest'

import { CODE_ALPHABET } from '~/config/membership-application-config'

import { createVerificationCode } from './create-verification-code.server'

const ISSUED_AT = Date.UTC(2026, 10, 6, 17, 42)

describe('createVerificationCode', () => {
  it('makes eight characters of the code alphabet', () => {
    const code = createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT)

    expect(code).toHaveLength(8)
    expect(
      [...code].every((character) => CODE_ALPHABET.includes(character)),
    ).toBe(true)
  })

  it('makes the same code again from the same address and moment', () => {
    expect(
      createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT),
    ).toBe(createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT))
  })

  it('reads the address without case', () => {
    expect(
      createVerificationCode('secret', 'Tereza@Local.dev', ISSUED_AT),
    ).toBe(createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT))
  })

  it('makes another code for another moment, address or secret', () => {
    const code = createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT)

    expect(
      createVerificationCode('secret', 'tereza@local.dev', ISSUED_AT + 1),
    ).not.toBe(code)
    expect(
      createVerificationCode('secret', 'jan@local.dev', ISSUED_AT),
    ).not.toBe(code)
    expect(
      createVerificationCode('other', 'tereza@local.dev', ISSUED_AT),
    ).not.toBe(code)
  })

  it('refuses an empty secret', () => {
    expect(() =>
      createVerificationCode('', 'tereza@local.dev', ISSUED_AT),
    ).toThrow()
  })
})

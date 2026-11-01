import { describe, expect, it } from 'vitest'

import { membershipDetailsSchema } from './membership-details-schema'

const VALID = {
  address: 'Lannova 12, 370 01 České Budějovice',
  dateOfBirth: '14. 5. 2009',
  email: 'tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  phone: '604 123 456',
}

const messagesFor = (value: Record<string, unknown>) => {
  const result = membershipDetailsSchema.safeParse(value)
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('membershipDetailsSchema', () => {
  it('accepts valid details and turns the date into YYYY-MM-DD', () => {
    const result = membershipDetailsSchema.parse(VALID)
    expect(result.dateOfBirth).toBe('2009-05-14')
    expect(result.firstName).toBe('Tereza')
  })

  it('trims what it stores', () => {
    const result = membershipDetailsSchema.parse({
      ...VALID,
      email: ' tereza@local.dev ',
      firstName: ' Tereza ',
    })
    expect(result.firstName).toBe('Tereza')
    expect(result.email).toBe('tereza@local.dev')
  })

  it('requires every field but the phone, in Czech', () => {
    expect(messagesFor({})).toEqual([
      'Vyplňte adresu trvalého bydliště.',
      'Vyplňte datum narození.',
      'Vyplňte e-mail.',
      'Vyplňte jméno.',
      'Vyplňte příjmení.',
    ])
  })

  it('refuses blank names', () => {
    expect(messagesFor({ ...VALID, firstName: '   ' })).toEqual([
      'Vyplňte jméno.',
    ])
  })

  it('refuses a date that is no day, and one in the future', () => {
    expect(messagesFor({ ...VALID, dateOfBirth: '31. 4. 2009' })).toEqual([
      'Zadejte datum ve tvaru 14. 5. 2009.',
    ])
    expect(messagesFor({ ...VALID, dateOfBirth: '1. 1. 2999' })).toEqual([
      'Datum narození nemůže být v budoucnosti.',
    ])
  })

  it('keeps to the limits of the script', () => {
    expect(messagesFor({ ...VALID, firstName: 'a'.repeat(101) })).toEqual([
      'Jméno je příliš dlouhé.',
    ])
    expect(messagesFor({ ...VALID, address: 'a'.repeat(301) })).toEqual([
      'Adresa je příliš dlouhá.',
    ])
    expect(messagesFor({ ...VALID, phone: '12345' })).toEqual([
      'Zadejte telefon ve tvaru 604 123 456.',
    ])
    expect(messagesFor({ ...VALID, phone: '+420 604 123 456' })).toEqual([])
  })

  it('leaves the phone out when there is none', () => {
    const { phone: _phone, ...withoutPhone } = VALID
    const result = membershipDetailsSchema.parse(withoutPhone)
    expect(result).not.toHaveProperty('phone')
  })

  it('refuses a malformed e-mail', () => {
    expect(messagesFor({ ...VALID, email: 'tereza@priklad' })).toEqual([
      'Zadejte e-mail ve tvaru jmeno@priklad.cz.',
    ])
  })
})

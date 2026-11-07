import { describe, expect, it } from 'vitest'

import { enrolmentSchema } from './_schema'

const VALID = {
  email: 'tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  phone: '604 123 456',
}

const errorsOf = (values: Record<string, unknown>, field: string) => {
  const result = enrolmentSchema.safeParse({ ...VALID, ...values })

  return (
    result.error?.issues
      .filter((issue) => issue.path[0] === field)
      .map((issue) => issue.message) ?? []
  )
}

describe('enrolmentSchema', () => {
  it('takes the four required fields alone', () => {
    expect(enrolmentSchema.parse(VALID)).toEqual(VALID)
  })

  it('takes the interest and trims it and the phone', () => {
    expect(
      enrolmentSchema.parse({
        ...VALID,
        interest: '  psaní, focení  ',
        phone: ' +420 604 123 456 ',
      }),
    ).toEqual({
      ...VALID,
      interest: 'psaní, focení',
      phone: '+420 604 123 456',
    })
  })

  it('leaves a blank interest out', () => {
    expect(enrolmentSchema.parse({ ...VALID, interest: '   ' })).toEqual(VALID)
  })

  it.each([
    ['firstName', 'Vyplňte jméno.'],
    ['lastName', 'Vyplňte příjmení.'],
    ['email', 'Vyplňte e-mail.'],
    ['phone', 'Vyplňte telefon.'],
  ])('asks for %s', (field, message) => {
    expect(errorsOf({ [field]: undefined }, field)).toEqual([message])
  })

  it('asks for a phone made only of spaces', () => {
    expect(errorsOf({ phone: '   ' }, 'phone')).toEqual(['Vyplňte telefon.'])
  })

  it.each([
    ['firstName', 'Zkraťte jméno na nejvýš 49 znaků.'],
    ['lastName', 'Zkraťte příjmení na nejvýš 49 znaků.'],
  ])('keeps %s short enough for the joined name to fit', (field, message) => {
    expect(errorsOf({ [field]: 'a'.repeat(49) }, field)).toEqual([])
    expect(errorsOf({ [field]: 'a'.repeat(50) }, field)).toEqual([message])
  })

  it.each([
    'tereza@local.dev',
    'https://priklad.cz',
    'http://priklad.cz',
    'ftp://priklad.cz',
    'www.priklad.cz',
    'WWW.PRIKLAD.CZ',
    'HTTPS:priklad',
    'Tereza\nMalá',
    'Tereza\u2028Malá',
  ])('refuses %j in a name, as the script would', (value) => {
    expect(errorsOf({ firstName: value }, 'firstName')).toEqual([
      'Zadejte jméno bez e-mailové adresy nebo odkazu.',
    ])
    expect(errorsOf({ lastName: value }, 'lastName')).toEqual([
      'Zadejte příjmení bez e-mailové adresy nebo odkazu.',
    ])
  })

  it.each([
    'tereza,mala@local.dev',
    'tereza;mala@local.dev',
    'tereza@local,dev.cz',
    'tereza@local;dev.cz',
    'tereza@local',
  ])('refuses the address %j', (email) => {
    expect(errorsOf({ email }, 'email')).toEqual([
      'Zadejte e-mail ve tvaru jmeno@priklad.cz.',
    ])
  })

  it('refuses a phone outside the pattern of the contract', () => {
    expect(errorsOf({ phone: '604-123-456' }, 'phone')).toEqual([
      'Zadejte telefon například ve tvaru 604 123 456 nebo +420 604 123 456.',
    ])
    expect(errorsOf({ phone: '604 123 456' }, 'phone')).toEqual([])
  })

  it('limits the interest to 2000 characters', () => {
    expect(errorsOf({ interest: 'a'.repeat(2000) }, 'interest')).toEqual([])
    expect(errorsOf({ interest: 'a'.repeat(2001) }, 'interest')).toEqual([
      'Zkraťte text na nejvýš 2\u00A0000 znaků.',
    ])
  })
})

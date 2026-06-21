import { describe, expect, test } from 'vitest'

import { createShortPaymentDescriptor } from './create-short-payment-descriptor.server'

const BASE_OPTIONS = {
  amount: 100,
  bic: 'TESTCZPP',
  currency: 'CZK',
  iban: 'CZ0000000000000000000000',
  message: 'Test message',
  name: 'Test Account',
  variableSymbol: '0000000000',
}

describe('createShortPaymentDescriptor', () => {
  test('should start with SPD header', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toMatch(/^SPD\*1\.0\*/)
  })

  test('should include IBAN and BIC in ACC field', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain(
      'ACC:CZ0000000000000000000000+TESTCZPP',
    )
  })

  test('should include currency', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain('CC:CZK')
  })

  test('should include recipient name', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain(
      'RN:Test Account',
    )
  })

  test('should format amount with two decimal places', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain('AM:100.00')
  })

  test('should format whole number amount correctly', () => {
    expect(
      createShortPaymentDescriptor({ ...BASE_OPTIONS, amount: 100 }),
    ).toContain('AM:100.00')
  })

  test('should include message', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain(
      'MSG:Test message',
    )
  })

  test('should include variable symbol', () => {
    expect(createShortPaymentDescriptor(BASE_OPTIONS)).toContain(
      'X-VS:0000000000',
    )
  })

  test('should join all fields with asterisk', () => {
    const result = createShortPaymentDescriptor(BASE_OPTIONS)
    expect(result).toBe(
      'SPD*1.0*ACC:CZ0000000000000000000000+TESTCZPP*CC:CZK*RN:Test Account*AM:100.00*MSG:Test message*X-VS:0000000000',
    )
  })
})

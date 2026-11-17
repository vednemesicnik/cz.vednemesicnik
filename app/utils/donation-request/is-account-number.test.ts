import { describe, expect, it } from 'vitest'

import { isAccountNumber } from './is-account-number'

describe('isAccountNumber', () => {
  it.each([
    '123456789/0800',
    '19-123456789/0800',
    'SK3112000000198742637541',
    'DE89370400440532013000',
    'CZ6508000000192000145399',
  ])('accepts %s', (accountNumber) => {
    expect(isAccountNumber(accountNumber)).toBe(true)
  })

  it.each([
    '',
    'abc',
    '123 456/0800',
    'SK31',
    '31SK12000000198742637541',
    'SK3112000000198742637541SK3112000000198742637541',
    'SK31-1200-0000-1987',
  ])('rejects %j', (accountNumber) => {
    expect(isAccountNumber(accountNumber)).toBe(false)
  })
})

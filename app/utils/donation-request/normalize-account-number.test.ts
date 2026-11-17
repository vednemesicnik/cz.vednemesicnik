import { describe, expect, it } from 'vitest'

import { normalizeAccountNumber } from './normalize-account-number'

describe('normalizeAccountNumber', () => {
  it('joins an IBAN typed in groups and capitalizes it', () => {
    expect(normalizeAccountNumber(' sk31 1200 0000 1987 4263 7541 ')).toBe(
      'SK3112000000198742637541',
    )
  })

  it('drops stray spaces from a Czech number', () => {
    expect(normalizeAccountNumber('19-123456789 / 0800')).toBe(
      '19-123456789/0800',
    )
  })
})

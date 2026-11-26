import { describe, expect, it } from 'vitest'

import { normalizeVerificationCode } from './normalize-verification-code'

describe('normalizeVerificationCode', () => {
  it('takes the code as the e-mail shows it', () => {
    expect(normalizeVerificationCode('K7M2 9XQP')).toBe('K7M29XQP')
  })

  it('takes lower case, hyphens and stray spaces', () => {
    expect(normalizeVerificationCode(' k7m2-9xqp ')).toBe('K7M29XQP')
  })
})

import { describe, expect, it } from 'vitest'

import { isEmailVerified } from './is-email-verified'

const APPLICATION = {
  code: 'VDM-7K3Q-2P',
  details: {
    address: 'Lannova 12, 370 01 České Budějovice',
    dateOfBirth: '2009-05-14',
    email: 'Tereza@local.dev',
    firstName: 'Tereza',
    lastName: 'Malá',
  },
  state: 'details' as const,
}

describe('isEmailVerified', () => {
  it('takes the details address without case', () => {
    expect(
      isEmailVerified({ ...APPLICATION, verifiedEmail: 'tereza@local.dev' }),
    ).toBe(true)
  })

  it('refuses another address and no verification', () => {
    expect(
      isEmailVerified({ ...APPLICATION, verifiedEmail: 'jan@local.dev' }),
    ).toBe(false)
    expect(isEmailVerified(APPLICATION)).toBe(false)
  })
})

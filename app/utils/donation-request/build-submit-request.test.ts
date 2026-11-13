import { describe, expect, it } from 'vitest'

import { buildSubmitRequest } from './build-submit-request'

const COMMON = {
  accounts: ['123456789/0800', '19-2000145399/0800'],
  address: { city: 'Praha', street: 'Lannova 12', zip: '11000' },
  email: 'tereza@local.dev',
  year: '2025',
}

describe('buildSubmitRequest', () => {
  it('joins the accounts and keeps the individual fields', () => {
    expect(
      buildSubmitRequest('2025-K7M2QX', {
        ...COMMON,
        dateOfBirth: '01.02.1990',
        firstName: 'Tereza',
        lastName: 'Malá',
        note: 'Dar v březnu',
        type: 'individual',
      }),
    ).toEqual({
      accounts: '123456789/0800,19-2000145399/0800',
      action: 'submit',
      city: 'Praha',
      dateOfBirth: '01.02.1990',
      email: 'tereza@local.dev',
      firstName: 'Tereza',
      lastName: 'Malá',
      note: 'Dar v březnu',
      requestId: '2025-K7M2QX',
      street: 'Lannova 12',
      type: 'individual',
      zip: '11000',
    })
  })

  it('sends no note when there is none, and only the entity fields', () => {
    const request = buildSubmitRequest('2025-K7M2QX', {
      ...COMMON,
      companyName: 'Firma s.r.o.',
      ico: '12345678',
      note: '',
      type: 'entity',
    })

    expect(request).not.toHaveProperty('note')
    expect(request).not.toHaveProperty('firstName')
    expect(request).toMatchObject({
      companyName: 'Firma s.r.o.',
      ico: '12345678',
      type: 'entity',
    })
  })
})

import type { AuthMethod } from '@generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { toSignInAttempt } from './to-sign-in-attempt'

const createdAt = new Date('2026-09-25T17:14:00Z')

describe('toSignInAttempt', () => {
  it.each<[AuthMethod, string]>([
    ['passkey', 'Passkey'],
    ['magic_link', 'Odkaz v e-mailu'],
    ['password', 'Heslo'],
    ['google', 'Google'],
    ['two_factor', 'Kód z ověřovací aplikace'],
    ['backup_code', 'Záložní kód'],
  ])(
    'labels a successful %s sign-in with the method alone',
    (method, label) => {
      expect(
        toSignInAttempt({
          createdAt,
          event: 'sign_in_success',
          id: '1',
          method,
        }),
      ).toEqual({
        dateTime: '2026-09-25T17:14:00.000Z',
        formattedDateTime: '25. 9. 2026, 19:14',
        id: '1',
        isFailure: false,
        label,
      })
    },
  )

  it('marks a failed sign-in in words', () => {
    expect(
      toSignInAttempt({
        createdAt,
        event: 'sign_in_failure',
        id: '1',
        method: 'password',
      }),
    ).toMatchObject({
      isFailure: true,
      label: 'Heslo — neúspěšný pokus',
    })
  })

  it('marks a failed second step as a failure too', () => {
    expect(
      toSignInAttempt({
        createdAt,
        event: 'two_factor_failure',
        id: '1',
        method: 'two_factor',
      }),
    ).toMatchObject({
      isFailure: true,
      label: 'Kód z ověřovací aplikace — neúspěšný pokus',
    })
  })

  it('skips a row without a method', () => {
    expect(
      toSignInAttempt({ createdAt, event: 'sign_out', id: '1', method: null }),
    ).toBeNull()
  })
})

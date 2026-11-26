import { describe, expect, test } from 'vitest'

import { describeSignInMethods } from './describe-sign-in-methods'
import type { SignInMethodSummary } from './get-sign-in-method-summary.server'

const summary: SignInMethodSummary = {
  hasPassword: true,
  isGoogleLinked: false,
  isTwoFactorEnabled: true,
  passkeyCount: 1,
  unusedBackupCodesCount: 6,
}

describe('describeSignInMethods', () => {
  test('words the drawn account (28e)', () => {
    expect(
      describeSignInMethods(summary, { isPasswordSignInAllowed: false }),
    ).toEqual({
      google: {
        note: 'Propojí se při prvním přihlášení přes Google s adresou @vednemesicnik.cz.',
        status: 'nepropojený',
      },
      passkey: { note: null, status: '1' },
      password: { note: 'Přihlášení heslem je vypnuté.', status: 'nastavené' },
      twoFactor: { note: 'zbývá 6 záložních kódů', status: 'zapnuté' },
    })
  })

  test('says a set password works while password sign-in is on', () => {
    expect(
      describeSignInMethods(summary, { isPasswordSignInAllowed: true }).password
        .note,
    ).toBe('Přihlášení heslem je zapnuté.')
  })

  test('words an account without a password, passkey or 2FA, linked to Google', () => {
    expect(
      describeSignInMethods(
        {
          hasPassword: false,
          isGoogleLinked: true,
          isTwoFactorEnabled: false,
          passkeyCount: 0,
          unusedBackupCodesCount: 0,
        },
        { isPasswordSignInAllowed: true },
      ),
    ).toEqual({
      google: { note: null, status: 'propojený' },
      passkey: { note: null, status: 'Zatím žádný.' },
      password: { note: null, status: 'nenastavené' },
      twoFactor: { note: null, status: 'vypnuté' },
    })
  })

  test('says when no backup code is left', () => {
    expect(
      describeSignInMethods(
        { ...summary, unusedBackupCodesCount: 0 },
        { isPasswordSignInAllowed: true },
      ).twoFactor,
    ).toEqual({ note: 'nezbývá žádný záložní kód', status: 'zapnuté' })
  })
})

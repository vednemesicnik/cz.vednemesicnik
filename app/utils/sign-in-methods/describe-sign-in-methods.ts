import { formatRemainingBackupCodes } from './format-remaining-backup-codes'
import type { SignInMethodSummary } from './get-sign-in-method-summary.server'

export type SignInMethodDescription = {
  status: string
  note: string | null
}

type Options = {
  isPasswordSignInAllowed: boolean
}

/**
 * Words an account's sign-in methods the way Settings (design 29a) and the
 * user detail (28e) show them: one wording for the same facts on both screens
 * (by062t6n). Settings takes only what it shows; the password's note and the
 * passkey count are the detail's own.
 *
 * @param summary - The account's methods from `getSignInMethodSummary`.
 * @param options.isPasswordSignInAllowed - Whether `ALLOW_PASSWORD_SIGN_IN` is
 *   on: a set password says whether it works right now.
 * @returns A status and an optional note for each method.
 */
export const describeSignInMethods = (
  summary: SignInMethodSummary,
  { isPasswordSignInAllowed }: Options,
): Record<
  'password' | 'twoFactor' | 'passkey' | 'google',
  SignInMethodDescription
> => ({
  google: summary.isGoogleLinked
    ? { note: null, status: 'propojený' }
    : {
        note: 'Propojí se při prvním přihlášení přes Google s adresou @vednemesicnik.cz.',
        status: 'nepropojený',
      },
  passkey: {
    note: null,
    status:
      summary.passkeyCount === 0 ? 'Zatím žádný.' : `${summary.passkeyCount}`,
  },
  // Without a password nobody signs in by one, so the switch goes unsaid.
  password: summary.hasPassword
    ? {
        note: isPasswordSignInAllowed
          ? 'Přihlášení heslem je zapnuté.'
          : 'Přihlášení heslem je vypnuté.',
        status: 'nastavené',
      }
    : { note: null, status: 'nenastavené' },
  twoFactor: summary.isTwoFactorEnabled
    ? {
        note: formatRemainingBackupCodes(summary.unusedBackupCodesCount),
        status: 'zapnuté',
      }
    : { note: null, status: 'vypnuté' },
})

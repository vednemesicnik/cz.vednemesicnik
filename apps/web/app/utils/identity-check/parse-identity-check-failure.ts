// How the identity check through Google failed (design 29d): another Google
// account (outside the domain too), or the round trip itself.
export type IdentityCheckFailure = 'google-account' | 'google-failed'

const failures: IdentityCheckFailure[] = ['google-account', 'google-failed']

/**
 * Reads the one-shot `identityCheck` parameter the Google callback returns to
 * Nastavení with. Anything unknown is ignored rather than trusted.
 *
 * @param value - The parameter's value.
 * @returns The failure, or `null`.
 */
export const parseIdentityCheckFailure = (
  value: string | null,
): IdentityCheckFailure | null =>
  failures.find((failure) => failure === value) ?? null

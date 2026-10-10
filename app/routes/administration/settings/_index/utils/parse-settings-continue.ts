export type SettingsContinue =
  | { dialog: 'change-password' | 'enable-two-factor' | 'disable-two-factor' }
  | { dialog: 'remove-passkey'; passkeyId: string }

const simpleDialogs = [
  'change-password',
  'enable-two-factor',
  'disable-two-factor',
] as const

/**
 * Reads the one-shot hint the identity check returns with (`?continue=…`):
 * which dialog the person was on their way to when they had to sign in again
 * (design 29d, 30a). Anything unknown is ignored rather than trusted.
 *
 * @param searchParams - The settings page's search params.
 * @param passkeyIds - The signed-in user's passkeys; a hint naming any other
 *   passkey is ignored.
 * @returns The dialog to reopen, or `null`.
 */
export const parseSettingsContinue = (
  searchParams: URLSearchParams,
  passkeyIds: string[],
): SettingsContinue | null => {
  const dialog = searchParams.get('continue')

  const simpleDialog = simpleDialogs.find((name) => name === dialog)
  if (simpleDialog !== undefined) {
    return { dialog: simpleDialog }
  }

  const passkeyId = searchParams.get('passkeyId')
  if (
    dialog === 'remove-passkey' &&
    passkeyId !== null &&
    passkeyIds.includes(passkeyId)
  ) {
    return { dialog, passkeyId }
  }

  return null
}

export type RegistrationProblem =
  | 'already-registered'
  | 'failed'
  | 'reauthenticate'

/**
 * Maps an error from the passkey prompt to what the page tells the user.
 *
 * @param error - What `startRegistration` threw.
 * @returns The problem to show, or `null` for a prompt the user closed or let
 * time out (`NotAllowedError`), which is a choice, not a failure.
 */
export const getRegistrationProblem = (
  error: unknown,
): RegistrationProblem | null => {
  if (!(error instanceof Error)) {
    return 'failed'
  }

  if (error.name === 'NotAllowedError') {
    return null
  }

  // `excludeCredentials` lists the account's passkeys, so the authenticator
  // refuses to register one it already holds.
  if (error.name === 'InvalidStateError') {
    return 'already-registered'
  }

  return 'failed'
}

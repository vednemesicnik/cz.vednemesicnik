/**
 * Tells a passkey prompt the person closed or let time out from a failure.
 *
 * @param error - What `startAuthentication` threw.
 * @returns `true` for `NotAllowedError`, which is a choice, not a failure: the
 *   chooser then says nothing (design 20a).
 */
export const isPromptDismissed = (error: unknown) =>
  error instanceof Error && error.name === 'NotAllowedError'

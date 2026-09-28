/** How long after signing in a session may change the account's sign-in methods. */
export const RECENT_AUTHENTICATION_MAX_AGE_MS = 10 * 60 * 1000

/**
 * Whether a session was signed in recently enough to change sign-in methods
 * (password, two-factor, passkeys) without signing in again.
 *
 * @param authenticatedAt - When the session was created.
 * @param now - The current time.
 * @returns `true` when the sign-in is at most `RECENT_AUTHENTICATION_MAX_AGE_MS` old.
 */
export const isRecentAuthentication = (
  authenticatedAt: Date,
  now: Date = new Date(),
) =>
  now.getTime() - authenticatedAt.getTime() <= RECENT_AUTHENTICATION_MAX_AGE_MS

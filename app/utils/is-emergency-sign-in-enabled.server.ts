/**
 * Whether the emergency mode is on: `ALLOW_PASSWORD_SIGN_IN`, the switch only
 * someone with Fly access flips during a Google outage, opens both the
 * emergency password and the emergency sign-in link (#578).
 *
 * @returns `true` while the switch is `"true"`.
 */
export const isEmergencySignInEnabled = () =>
  process.env.ALLOW_PASSWORD_SIGN_IN === 'true'

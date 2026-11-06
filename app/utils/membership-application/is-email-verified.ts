import type { MembershipApplicationState } from './read-membership-application-cookie.server'

/**
 * Whether the code confirmed the address the details hold now. A changed
 * address is not verified, whatever the cookie says about the old one.
 *
 * @param application - The application in progress.
 * @returns `true` when `verifiedEmail` is the details' address, without case.
 */
export const isEmailVerified = (
  application: Extract<MembershipApplicationState, { state: 'details' }>,
): boolean =>
  application.verifiedEmail === application.details.email.toLowerCase()

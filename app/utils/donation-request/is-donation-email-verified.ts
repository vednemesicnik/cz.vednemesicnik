import type { DonationRequestState } from './read-donation-request-cookie.server'

/**
 * Whether the code confirmed the address the details hold now. A changed
 * address is not verified, whatever the cookie says about the old one.
 *
 * @param state - The request in progress.
 * @returns `true` when `verifiedEmail` is the details' address, without case.
 */
export const isDonationEmailVerified = (
  state: Extract<DonationRequestState, { state: 'details' }>,
): boolean => state.verifiedEmail === state.details.email.toLowerCase()

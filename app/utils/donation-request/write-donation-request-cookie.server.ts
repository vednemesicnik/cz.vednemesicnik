import { donationRequestCookie } from './donation-request-cookie.server'
import type { DonationRequestState } from './read-donation-request-cookie.server'

// A week: long enough to find the e-mail and to come back to the form.
const DETAILS_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
// Long enough to read the sent page and copy the request's code from it.
const SENT_MAX_AGE_SECONDS = 60 * 60

/**
 * Overwrites the cookie. Sending a request replaces its details with the code
 * the sent page shows, so they leave the browser with it.
 *
 * @param state - What to hold.
 * @returns The `Set-Cookie` header value.
 */
export const writeDonationRequestCookie = (
  state: DonationRequestState,
): Promise<string> =>
  donationRequestCookie.serialize(state, {
    maxAge:
      state.state === 'details'
        ? DETAILS_MAX_AGE_SECONDS
        : SENT_MAX_AGE_SECONDS,
  })

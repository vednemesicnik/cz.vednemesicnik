import { formatNumericDate } from '~/utils/format-numeric-date'

import { membershipApplicationCookie } from './membership-application-cookie.server'
import type { MembershipApplicationState } from './read-membership-application-cookie.server'

// People leave for a printer and a scanner between the steps (design 15d).
const DETAILS_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
// Long enough to read the sent page and copy the code from it.
const SENT_MAX_AGE_SECONDS = 60 * 60

/**
 * Overwrites the cookie. Sending an application replaces its details with the
 * address and the code the sent page shows, so they leave the browser with it.
 *
 * @param state - What to hold.
 * @returns The `Set-Cookie` header value.
 */
export const writeMembershipApplicationCookie = (
  state: MembershipApplicationState,
): Promise<string> =>
  state.state === 'details'
    ? membershipApplicationCookie.serialize(
        {
          ...state,
          details: {
            ...state.details,
            // As the reader's schema takes it in, so one schema covers both.
            dateOfBirth: formatNumericDate(new Date(state.details.dateOfBirth)),
          },
        },
        { maxAge: DETAILS_MAX_AGE_SECONDS },
      )
    : membershipApplicationCookie.serialize(state, {
        maxAge: SENT_MAX_AGE_SECONDS,
      })

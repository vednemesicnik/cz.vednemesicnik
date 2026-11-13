import type { SubmitRequest } from '@generated/donation-confirmation/response'

import type { DonationRequestDetails } from './read-donation-request-cookie.server'

/**
 * The script's `submit` from the details the donor saved: the accounts joined,
 * only the fields of the donor's type, and no note when there is none.
 *
 * @param requestId - The request's code, its idempotency key.
 * @param details - The details from the cookie.
 * @returns The request body, before it is signed.
 */
export const buildSubmitRequest = (
  requestId: string,
  details: DonationRequestDetails,
): SubmitRequest => {
  const common = {
    accounts: details.accounts.join(','),
    action: 'submit' as const,
    city: details.address.city,
    email: details.email,
    requestId,
    street: details.address.street,
    zip: details.address.zip,
    ...(details.note ? { note: details.note } : {}),
  }

  switch (details.type) {
    case 'individual':
      return {
        ...common,
        dateOfBirth: details.dateOfBirth,
        firstName: details.firstName,
        lastName: details.lastName,
        type: 'individual',
      }
    case 'sole_trader':
      return {
        ...common,
        firstName: details.firstName,
        ico: details.ico,
        lastName: details.lastName,
        type: 'sole_trader',
      }
    case 'entity':
      return {
        ...common,
        companyName: details.companyName,
        ico: details.ico,
        type: 'entity',
      }
  }
}

import { z } from 'zod'

import { donationRequestCookie } from './donation-request-cookie.server'

// The form's output as the action saved it. Not the form's schema: the cookie
// is signed, and the year a form offered stays valid after New Year.
const common = {
  accounts: z.array(z.string()),
  address: z.object({ city: z.string(), street: z.string(), zip: z.string() }),
  email: z.string(),
  note: z.string().optional(),
  year: z.string(),
}

const detailsSchema = z.discriminatedUnion('type', [
  z.object({
    ...common,
    dateOfBirth: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    type: z.literal('individual'),
  }),
  z.object({
    ...common,
    firstName: z.string(),
    ico: z.string(),
    lastName: z.string(),
    type: z.literal('sole_trader'),
  }),
  z.object({
    ...common,
    companyName: z.string(),
    ico: z.string(),
    type: z.literal('entity'),
  }),
])

const stateSchema = z.discriminatedUnion('state', [
  z.object({
    details: detailsSchema,
    // The request's code, its idempotency key in the script.
    requestId: z.string(),
    state: z.literal('details'),
    // When the verification code for the details' address was sent; the code
    // itself is made again from it and never stored (log 0073).
    verification: z.object({ issuedAt: z.number().int() }).optional(),
    // The address the code confirmed, lower-cased.
    verifiedEmail: z.string().optional(),
  }),
  z.object({
    requestId: z.string(),
    state: z.literal('sent'),
  }),
])

export type DonationRequestDetails = z.output<typeof detailsSchema>

export type DonationRequestState = z.output<typeof stateSchema>

/**
 * @param request - The request carrying the cookie.
 * @returns The request in progress, or what the sent page shows after it;
 *   `null` when there is no cookie or its value does not hold up.
 */
export const readDonationRequestCookie = async (
  request: Request,
): Promise<DonationRequestState | null> => {
  const value = await donationRequestCookie.parse(request.headers.get('Cookie'))
  const result = stateSchema.safeParse(value)

  return result.success ? result.data : null
}

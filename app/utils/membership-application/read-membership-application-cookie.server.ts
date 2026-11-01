import { z } from 'zod'

import { membershipApplicationCookie } from './membership-application-cookie.server'
import { membershipDetailsSchema } from './membership-details-schema'

const stateSchema = z.discriminatedUnion('state', [
  z.object({
    code: z.string(),
    details: membershipDetailsSchema,
    state: z.literal('details'),
  }),
  z.object({
    code: z.string(),
    email: z.string(),
    state: z.literal('sent'),
  }),
])

export type MembershipApplicationState = z.output<typeof stateSchema>

/**
 * @param request - The request carrying the cookie.
 * @returns The application in progress, or what the sent page shows after it;
 *   `null` when there is no cookie or its value does not hold up.
 */
export const readMembershipApplicationCookie = async (
  request: Request,
): Promise<MembershipApplicationState | null> => {
  const value = await membershipApplicationCookie.parse(
    request.headers.get('Cookie'),
  )
  const result = stateSchema.safeParse(value)

  return result.success ? result.data : null
}

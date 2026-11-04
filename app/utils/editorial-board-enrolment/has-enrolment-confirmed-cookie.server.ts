import { z } from 'zod'

import { enrolmentConfirmedCookie } from './enrolment-confirmed-cookie.server'

const valueSchema = z.object({ confirmed: z.literal(true) })

/**
 * @param request - The request carrying the cookie.
 * @returns Whether this browser just confirmed an enrolment; `false` when there is no
 *   cookie or its value does not hold up.
 */
export const hasEnrolmentConfirmedCookie = async (
  request: Request,
): Promise<boolean> => {
  const value = await enrolmentConfirmedCookie.parse(
    request.headers.get('Cookie'),
  )

  return valueSchema.safeParse(value).success
}

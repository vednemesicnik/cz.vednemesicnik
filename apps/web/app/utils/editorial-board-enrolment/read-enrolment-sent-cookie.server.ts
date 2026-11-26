import { z } from 'zod'

import { enrolmentSentCookie } from './enrolment-sent-cookie.server'

const valueSchema = z.object({ email: z.string() })

/**
 * @param request - The request carrying the cookie.
 * @returns The address the sent page names; `null` when there is no cookie or its
 *   value does not hold up.
 */
export const readEnrolmentSentCookie = async (
  request: Request,
): Promise<string | null> => {
  const value = await enrolmentSentCookie.parse(request.headers.get('Cookie'))
  const result = valueSchema.safeParse(value)

  return result.success ? result.data.email : null
}

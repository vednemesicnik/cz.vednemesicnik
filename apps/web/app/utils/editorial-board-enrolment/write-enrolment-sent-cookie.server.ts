import { enrolmentSentCookie } from './enrolment-sent-cookie.server'

/**
 * @param email - The address the sent page names.
 * @returns The `Set-Cookie` header value.
 */
export const writeEnrolmentSentCookie = (email: string): Promise<string> =>
  enrolmentSentCookie.serialize({ email })

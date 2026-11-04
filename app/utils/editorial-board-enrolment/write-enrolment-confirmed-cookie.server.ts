import { enrolmentConfirmedCookie } from './enrolment-confirmed-cookie.server'

/** @returns The `Set-Cookie` header value. */
export const writeEnrolmentConfirmedCookie = (): Promise<string> =>
  enrolmentConfirmedCookie.serialize({ confirmed: true })

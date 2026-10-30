import { readerViewCookie } from './reader-view-cookie.server'

/**
 * Ends the reader view (10d): back to the editorial preview, and for whoever
 * signs in next in this browser after a sign-out.
 *
 * @returns The `Set-Cookie` value that removes the cookie.
 */
export const clearReaderViewCookie = () =>
  readerViewCookie.serialize('', { maxAge: 0 })

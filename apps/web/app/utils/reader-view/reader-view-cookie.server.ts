import { createCookie } from 'react-router'

/**
 * Whether a signed-in author views the web as a reader (10d). A session cookie
 * without an expiry, so the choice ends with the browser session.
 */
export const readerViewCookie = createCookie('vdm_reader_view', {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
})

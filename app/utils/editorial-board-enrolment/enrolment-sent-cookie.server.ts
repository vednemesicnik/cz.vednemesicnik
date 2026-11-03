import { createCookie } from 'react-router'

/**
 * Carries the address to the sent page, since it does not belong in a URL. Its path
 * is the form's, which covers `…/sent` and that page's `.data` request; the form's
 * own `.data` request does not read it.
 */
export const enrolmentSentCookie = createCookie('vdm_enrolment_sent', {
  httpOnly: true,
  // Long enough to read the page and go to the mailbox.
  maxAge: 60 * 60,
  path: '/editorial-board/enrolment',
  sameSite: 'lax',
  secrets: process.env.SESSION_SECRET?.split(','),
  secure: process.env.NODE_ENV === 'production',
})

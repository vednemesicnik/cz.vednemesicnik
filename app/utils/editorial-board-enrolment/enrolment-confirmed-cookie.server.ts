import { createCookie } from 'react-router'

/**
 * Lets the confirmed page open only for whoever just confirmed. Its path is the
 * confirmation page's, which covers `…/done` and that page's `.data` request.
 */
export const enrolmentConfirmedCookie = createCookie(
  'vdm_enrolment_confirmed',
  {
    httpOnly: true,
    // Long enough to read the page and reload it.
    maxAge: 60 * 60,
    path: '/editorial-board/enrolment/confirm',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  },
)

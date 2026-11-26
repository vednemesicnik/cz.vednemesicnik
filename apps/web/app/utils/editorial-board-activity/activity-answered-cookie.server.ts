import { createCookie } from 'react-router'

/**
 * Lets the done page open only for whoever just answered, and says which answer it was.
 * Its path is the confirmation page's, which covers `…/done` and that page's `.data`
 * request.
 */
export const activityAnsweredCookie = createCookie('vdm_activity_answered', {
  httpOnly: true,
  // Long enough to read the page and reload it.
  maxAge: 60 * 60,
  path: '/editorial-board/activity/confirm',
  sameSite: 'lax',
  secrets: process.env.SESSION_SECRET?.split(','),
  secure: process.env.NODE_ENV === 'production',
})

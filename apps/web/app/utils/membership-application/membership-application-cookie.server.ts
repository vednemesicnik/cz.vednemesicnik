import { createCookie } from 'react-router'

/**
 * Holds an application between the steps, so nothing about it is stored on our
 * side (design 15d). Its path is the flow's parent and not the route itself: a
 * cookie scoped to an exact route misses that route's `.data` requests.
 */
export const membershipApplicationCookie = createCookie(
  'vdm_membership_application',
  {
    httpOnly: true,
    path: '/organization/membership',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  },
)

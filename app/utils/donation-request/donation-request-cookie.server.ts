import { createCookie } from 'react-router'

/**
 * Holds a donation request between the form and the code, so nothing about it
 * is stored on our side until the address is confirmed. Its path is the flow's
 * parent and not a route itself: a cookie scoped to an exact route misses that
 * route's `.data` requests.
 */
export const donationRequestCookie = createCookie('vdm_donation_request', {
  httpOnly: true,
  path: '/donate/request-confirmation',
  sameSite: 'lax',
  secrets: process.env.SESSION_SECRET?.split(','),
  secure: process.env.NODE_ENV === 'production',
})

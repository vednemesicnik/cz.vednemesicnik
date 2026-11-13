import { createCookie } from 'react-router'

/**
 * Holds a donation request between the form and the code, so nothing about it
 * is stored on our side until the address is confirmed. Its path is `/donate`,
 * the form route's parent: a cookie scoped to `/donate/request-confirmation`
 * misses that route's own `.data` requests (`/donate/request-confirmation.data`).
 */
export const donationRequestCookie = createCookie('vdm_donation_request', {
  httpOnly: true,
  path: '/donate',
  sameSite: 'lax',
  secrets: process.env.SESSION_SECRET?.split(','),
  secure: process.env.NODE_ENV === 'production',
})

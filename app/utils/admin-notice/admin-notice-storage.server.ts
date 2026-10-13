import { createCookie, createCookieSessionStorage } from 'react-router'

type AdminNoticeFlashData = {
  toast: string
}

// A post/redirect/get carrier for a toast the page a redirect lands on shows,
// e.g. Smazáno on the list after a delete from the detail (design 23f).
// `/administration`, not the list's own path: its Single Fetch request is
// `….data`, which an exact path doesn't match.
export const adminNoticeStorage = createCookieSessionStorage<
  Record<string, never>,
  AdminNoticeFlashData
>({
  cookie: createCookie('vdm_admin_notice', {
    httpOnly: true,
    maxAge: 60,
    path: '/administration',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

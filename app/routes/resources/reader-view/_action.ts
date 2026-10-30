import { redirect } from 'react-router'
import { readerViewCookie } from '~/utils/reader-view/reader-view-cookie.server'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

/**
 * Switches the reader view on or off (10d) and returns to the page the bar was
 * on. No CSRF token: the cookie is SameSite=Lax, so a cross-site post carries
 * no sign-in, and a forged switch only changes the visitor's own view.
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  const isReaderView = formData.get('readerView') === 'on'
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/')

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': isReaderView
        ? await readerViewCookie.serialize(true)
        : await readerViewCookie.serialize('', { maxAge: 0 }),
    },
  })
}

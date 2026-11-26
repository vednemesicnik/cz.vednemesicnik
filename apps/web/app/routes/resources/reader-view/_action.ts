import { redirect } from 'react-router'
import { clearReaderViewCookie } from '~/utils/reader-view/clear-reader-view-cookie.server'
import { readerViewCookie } from '~/utils/reader-view/reader-view-cookie.server'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

/**
 * Switches the reader view on or off (10d) and returns to the page the bar was
 * on. No CSRF token: the action reads no session and changes nothing stored,
 * only this browser's view preference, so a forged post can at most switch a
 * visitor's own view.
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  const isReaderView = formData.get('readerView') === 'on'
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/')

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': isReaderView
        ? await readerViewCookie.serialize(true)
        : await clearReaderViewCookie(),
    },
  })
}

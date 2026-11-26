import { data, type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { readSignInNotice } from '~/utils/sign-in-notice/read-sign-in-notice.server'
import { withRedirectTo } from '~/utils/with-redirect-to'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'))

  const { notice, setCookie } = await readSignInNotice(request)

  // Only the sent state lives here (20b). A direct visit or a reload goes back
  // to the chooser (20a), so a reload never sends another link.
  if (notice?.kind !== 'magic-link-sent') {
    throw redirect(withRedirectTo('/administration/sign-in', redirectTo), {
      headers: { 'Set-Cookie': setCookie },
    })
  }

  return data(
    { email: notice.email, redirectTo },
    { headers: { 'Set-Cookie': setCookie } },
  )
}

import { type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { withRedirectTo } from '~/utils/with-redirect-to'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'))

  // Break-glass: the password page is only reachable when explicitly enabled.
  // Otherwise send the user back to the sign-in chooser.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw redirect(withRedirectTo('/administration/sign-in', redirectTo))
  }

  return { redirectTo }
}

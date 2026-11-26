import { data, type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { readSignInNotice } from '~/utils/sign-in-notice/read-sign-in-notice.server'
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

  // The second factor ended on its own (five wrong codes, five minutes): say
  // why, with the e-mail kept (20d).
  const { notice, setCookie } = await readSignInNotice(request)
  const twoFactorEnded = notice?.kind === 'two-factor-ended' ? notice : null

  return data(
    {
      email: twoFactorEnded?.email ?? null,
      redirectTo,
      twoFactorEnded: twoFactorEnded?.reason ?? null,
    },
    { headers: { 'Set-Cookie': setCookie } },
  )
}

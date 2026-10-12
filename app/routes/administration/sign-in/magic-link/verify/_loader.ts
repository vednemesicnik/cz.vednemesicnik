import { data, type LoaderFunctionArgs, redirect } from 'react-router'

import { getAuthentication } from '~/utils/auth.server'
import { isLinkForUser } from '~/utils/identity-check/is-link-for-user.server'
import { verifyMagicLinkToken } from '~/utils/magic-link.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { withRedirectTo } from '~/utils/with-redirect-to'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // A signed-in browser opens the link as an identity check (design 20c, 29d):
  // the same account confirms it, another account is refused.
  const { userId } = await getAuthentication(request)
  const isSignedIn = userId !== undefined

  // This page carries the single-use sign-in token in the URL (and rendered into
  // the confirm form): never cache it, and suppress the Referer header so the
  // token can't leak to cross-origin subresources (e.g. the font stylesheet).
  const noStoreHeaders = {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? null
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'))

  const invalidSignedIn = () =>
    data(
      { redirectTo, status: 'invalid-signed-in' as const },
      { headers: noStoreHeaders },
    )

  if (token === null || email === null || email === '') {
    if (isSignedIn) return invalidSignedIn()

    // Only a hand-edited link lacks the address; with nothing to resend to,
    // it starts over at the chooser.
    throw redirect(withRedirectTo('/administration/sign-in', redirectTo))
  }

  // The address in the link is the one the person typed, so the invalid card
  // may repeat it and resend to it in one click (20c).
  const invalid = () =>
    isSignedIn
      ? invalidSignedIn()
      : data(
          { email, redirectTo, status: 'invalid' as const },
          { headers: noStoreHeaders },
        )

  // Validate only — do NOT consume here. Email clients / link scanners issue GET
  // requests that would otherwise burn the single-use token before the real
  // click. The token is consumed by the POST action behind the confirm button.
  const isValid = await verifyMagicLinkToken(email, token)

  if (!isValid) {
    return invalid()
  }

  if (isSignedIn) {
    // Left unused: the link still works in the browser it was meant for.
    if (!(await isLinkForUser(email, userId))) {
      return data(
        { email, status: 'other-account' as const },
        { headers: noStoreHeaders },
      )
    }

    return data(
      { email, redirectTo, status: 'verify-identity' as const, token },
      { headers: noStoreHeaders },
    )
  }

  return data(
    { email, redirectTo, status: 'valid' as const, token },
    { headers: noStoreHeaders },
  )
}

import { data, type LoaderFunctionArgs } from 'react-router'

import { getAuthentication } from '~/utils/auth.server'
import { findEmergencySignInLink } from '~/utils/emergency-sign-in-link/find-emergency-sign-in-link.server'
import { getUserAuthorNames } from '~/utils/emergency-sign-in-link/get-user-author-names.server'
import { isEmergencySignInEnabled } from '~/utils/is-emergency-sign-in-enabled.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { userId } = await getAuthentication(request)
  const isSignedIn = userId !== undefined

  // The token in the URL signs in: never cache the page, and keep it out of
  // the Referer of cross-origin subresources (as the magic link, 20c).
  const noStoreHeaders = {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  }

  const invalid = () =>
    isSignedIn
      ? data(
          { status: 'invalid-signed-in' as const },
          { headers: noStoreHeaders },
        )
      : data({ status: 'invalid' as const }, { headers: noStoreHeaders })

  const token = new URL(request.url).searchParams.get('token')

  // With the emergency mode off the token isn't even looked up: the same card
  // as for a used link, not a redirect (design 20f).
  if (!isEmergencySignInEnabled() || token === null || token === '') {
    return invalid()
  }

  // Validate only, don't consume: opening the link never signs in, the button
  // does (design 20f).
  const link = await findEmergencySignInLink(token)

  if (link === null || !link.isValid) return invalid()

  // A signed-in browser leaves the link unused (design 20f).
  if (isSignedIn) {
    return link.userId === userId
      ? data(
          { email: link.email, status: 'same-account' as const },
          { headers: noStoreHeaders },
        )
      : data(
          { email: link.email, status: 'other-account' as const, token },
          { headers: noStoreHeaders },
        )
  }

  const issuerNames = await getUserAuthorNames([link.issuedById])

  return data(
    {
      email: link.email,
      issuerName: issuerNames.get(link.issuedById) ?? null,
      status: 'valid' as const,
      token,
    },
    { headers: noStoreHeaders },
  )
}

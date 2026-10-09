import { data, type LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { verifyMagicLinkToken } from '~/utils/magic-link.server'
import { safeRedirect } from '~/utils/safe-redirect'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

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

  if (token === null || email === null || email === '') {
    return data(
      { redirectTo, status: 'invalid' as const },
      { headers: noStoreHeaders },
    )
  }

  // Validate only — do NOT consume here. Email clients / link scanners issue GET
  // requests that would otherwise burn the single-use token before the real
  // click. The token is consumed by the POST action behind the confirm button.
  const isValid = await verifyMagicLinkToken(email, token)

  if (!isValid) {
    return data(
      { redirectTo, status: 'invalid' as const },
      { headers: noStoreHeaders },
    )
  }

  return data(
    { email, redirectTo, status: 'valid' as const, token },
    { headers: noStoreHeaders },
  )
}

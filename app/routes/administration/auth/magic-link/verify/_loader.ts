import type { LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { verifyMagicLinkToken } from '~/utils/magic-link.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? null

  if (token === null || email === null || email === '') {
    return { status: 'invalid' as const }
  }

  // Validate only — do NOT consume here. Email clients / link scanners issue GET
  // requests that would otherwise burn the single-use token before the real
  // click. The token is consumed by the POST action behind the confirm button.
  const isValid = await verifyMagicLinkToken(email, token)

  if (!isValid) {
    return { status: 'invalid' as const }
  }

  return { email, status: 'valid' as const, token }
}

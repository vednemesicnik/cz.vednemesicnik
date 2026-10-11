import type { LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)

  return { redirectTo: safeRedirect(url.searchParams.get('redirectTo')) }
}

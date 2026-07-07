import type { LoaderFunctionArgs } from 'react-router'

import { requireAuthentication } from '~/utils/auth.server'

export const loader = async ({ request, url }: LoaderFunctionArgs) => {
  await requireAuthentication({ request, url })

  return { status: 'success' }
}

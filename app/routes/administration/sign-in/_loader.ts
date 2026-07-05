import type { LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  // Break-glass: only render the password form when the flag is enabled.
  return { allowPasswordLogin: process.env.ALLOW_PASSWORD_LOGIN === 'true' }
}

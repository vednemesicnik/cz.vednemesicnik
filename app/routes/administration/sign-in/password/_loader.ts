import { type LoaderFunctionArgs, redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  // Break-glass: the password page is only reachable when explicitly enabled.
  // Otherwise send the user back to the sign-in chooser.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw redirect('/administration/sign-in')
  }

  return null
}

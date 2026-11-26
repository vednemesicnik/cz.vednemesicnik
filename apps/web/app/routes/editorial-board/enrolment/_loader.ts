import { data } from 'react-router'

import { commitCSRF } from '~/utils/csrf.server'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [csrfToken, csrfCookie] = await commitCSRF(request)

  return data(
    { csrfToken, honeypotInputProps: getHoneypotInputProps() },
    { headers: csrfCookie ? { 'Set-Cookie': csrfCookie } : {} },
  )
}

import type { LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'

// Callback error codes → Czech messages. Only known codes render a message, so
// the ?error param can't inject arbitrary text.
const ERROR_MESSAGES: Record<string, string> = {
  account: 'Účet neexistuje, kontaktujte administrátora.',
  domain: 'Přihlásit se mohou jen účty na doméně vednemesicnik.cz.',
  oauth: 'Přihlášení přes Google se nezdařilo. Zkuste to prosím znovu.',
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)

  // Where to return after sign-in (same-origin only). Threaded into the OAuth
  // start form so it survives the round-trip to Google.
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'))

  const errorCode = url.searchParams.get('error')
  const error = errorCode !== null ? (ERROR_MESSAGES[errorCode] ?? null) : null

  return {
    // Break-glass: only render the password form when the flag is enabled.
    allowPasswordSignIn: process.env.ALLOW_PASSWORD_SIGN_IN === 'true',
    error,
    redirectTo,
  }
}

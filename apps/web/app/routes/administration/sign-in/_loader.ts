import { data, type LoaderFunctionArgs } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { readSignInNotice } from '~/utils/sign-in-notice/read-sign-in-notice.server'

// Callback error codes → Czech messages (design 20a, copy gs905c2e). Only known
// codes render a message, so the ?error param can't inject arbitrary text.
const ERROR_MESSAGES: Record<string, string> = {
  account:
    'Požádejte Administrátora o pozvánku — k tomuto účtu Google tu není uživatel.',
  domain:
    'Vyberte účet Google s adresou @vednemesicnik.cz — jinou adresou se přihlásit nelze.',
  oauth: 'Zkuste přihlášení přes Google znovu nebo si pošlete odkaz e-mailem.',
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  const url = new URL(request.url)

  // Where to return after sign-in (same-origin only). Threaded into the OAuth
  // start form and the magic-link request so it survives the round-trip to
  // Google or the inbox.
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'))

  const errorCode = url.searchParams.get('error')
  const error = errorCode !== null ? (ERROR_MESSAGES[errorCode] ?? null) : null

  // A link request the magic-link action rejected (wrong domain, rate limit)
  // comes back to this field (20b).
  const { notice, setCookie } = await readSignInNotice(request)
  const magicLinkResult =
    notice?.kind === 'magic-link-rejected' ? notice.submissionResult : null

  return data(
    {
      // Break-glass: only render the password form when the flag is enabled.
      allowPasswordSignIn: process.env.ALLOW_PASSWORD_SIGN_IN === 'true',
      error,
      magicLinkResult,
      redirectTo,
    },
    { headers: { 'Set-Cookie': setCookie } },
  )
}

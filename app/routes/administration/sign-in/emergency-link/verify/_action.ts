import { data, href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { deleteSession } from '~/routes/administration/sign-out/utils/delete-session.server'
import {
  deleteSessionAuthCookieSession,
  getAuthentication,
  getSessionAuthCookieSession,
} from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { consumeEmergencySignInLink } from '~/utils/emergency-sign-in-link/consume-emergency-sign-in-link.server'
import { createEmergencySignInLinkUrl } from '~/utils/emergency-sign-in-link/create-emergency-sign-in-link-url'
import { findEmergencySignInLink } from '~/utils/emergency-sign-in-link/find-emergency-sign-in-link.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { isEmergencySignInEnabled } from '~/utils/is-emergency-sign-in-enabled.server'
import { signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'

const invalid = () => data({ status: 'invalid' as const })

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  // Off: the same card as for a used link, nothing looked up (design 20f).
  if (!isEmergencySignInEnabled()) return invalid()

  const token = formData.get('token')
  if (typeof token !== 'string' || token === '') return invalid()

  // Back to this page with the same token, which then shows its card.
  const link = new URL(
    createEmergencySignInLinkUrl({ baseUrl: request.url, token }),
  )
  const backToLink = (init?: ResponseInit) =>
    redirect(link.pathname + link.search, { status: 303, ...init })

  const authentication = await getAuthentication(request)

  if (
    formData.get(FORM_CONFIG.intent.name) === FORM_CONFIG.intent.value.signOut
  ) {
    // „Odhlásit se a pokračovat“: the other account's session goes, the link
    // stays unused and the page shows its confirmation (design 20f).
    if (authentication.sessionId !== undefined) {
      recordAuthLog({
        event: 'sign_out',
        request,
        userId: authentication.userId,
      })
      deleteSession(authentication.sessionId)
    }

    throw backToLink({
      headers: {
        'Set-Cookie': await deleteSessionAuthCookieSession(
          await getSessionAuthCookieSession(request),
        ),
      },
    })
  }

  // A signed-in browser never consumes the link (design 20f).
  if (authentication.userId !== undefined) throw backToLink()

  const emergencyLink = await findEmergencySignInLink(token)

  if (emergencyLink === null) return invalid()

  // Single use: whoever marks it used first signs in.
  if (!(await consumeEmergencySignInLink(token))) {
    // A link the app knows belongs to an account: its failure is that
    // account's attempt, with the issuer (28e, 29a).
    recordAuthLog({
      emergencySignInLinkId: emergencyLink.id,
      event: 'sign_in_failure',
      method: 'emergency_link',
      request,
      userId: emergencyLink.userId,
    })

    return invalid()
  }

  // Always throws: a redirect to Nastavení, which suggests a passkey (#575).
  return await signInUser(request, emergencyLink.userId, 'emergency_link', {
    emergencySignInLinkId: emergencyLink.id,
    redirectTo: href('/administration/settings'),
  })
}

import { data } from 'react-router'

import { recordAuditLog } from '~/utils/audit-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { createEmergencySignInLinkUrl } from '~/utils/emergency-sign-in-link/create-emergency-sign-in-link-url'
import { issueEmergencySignInLink } from '~/utils/emergency-sign-in-link/issue-emergency-sign-in-link.server'
import { formatTime } from '~/utils/format-time'
import { isEmergencySignInEnabled } from '~/utils/is-emergency-sign-in-enabled.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canIssueEmergencySignInLink } from '~/utils/permissions/user/guards/can-issue-emergency-sign-in-link'
import { publishAccountEvent } from '~/utils/sse/publish-account-event.server'

import { schema } from './_schema'
import type { Route } from './+types/route'

const notFound = () => data({ status: 'not-found' as const }, { status: 404 })

// Issues an emergency sign-in link from the dialog on the user detail (#578,
// design 28e). The link exists only in this response; it never leaves by
// e-mail. A fetcher action, so failures are returned, not thrown.
export const action = async ({ request, params }: Route.ActionArgs) => {
  // Off outside a Google outage: the action doesn't exist.
  if (!isEmergencySignInEnabled()) return notFound()

  const formData = await request.formData()

  // The dialog stays open, so a stale token is its error line, not the error
  // boundary (design 30h); the layout then reissues the token.
  if ((await checkCSRF(formData, request)) !== null) {
    return data({ status: 'csrf' as const }, { status: 403 })
  }

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  const user = await prisma.user.findUnique({
    select: { id: true, role: { select: { level: true } } },
    where: { id: params.userId },
  })

  // An account the person may not issue a link for is a 404, like a deleted
  // one (design 30e).
  if (
    user === null ||
    !canIssueEmergencySignInLink(context, {
      targetUserId: user.id,
      targetUserRoleLevel: user.role.level,
    })
  ) {
    return notFound()
  }

  if (!schema.safeParse(Object.fromEntries(formData)).success) {
    return data({ status: 'unconfirmed' as const }, { status: 400 })
  }

  const { expiresAt, token } = await issueEmergencySignInLink({
    issuedById: context.userId,
    userId: user.id,
  })

  recordAuditLog({
    actorId: context.userId,
    event: 'emergency_link_issued',
    request,
    targetId: user.id,
  })

  // The user's detail shows the link that still works.
  publishAccountEvent({ change: 'update', entity: 'user', entityId: user.id })

  return data(
    {
      expiresAt: formatTime(expiresAt),
      status: 'issued' as const,
      url: createEmergencySignInLinkUrl({
        baseUrl: process.env.BASE_URL,
        token,
      }),
    },
    // The link signs in: never cache the response that carries it.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

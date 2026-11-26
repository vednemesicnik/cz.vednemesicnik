import { data } from 'react-router'

import { getAccountHistory } from '~/utils/audit-log/get-account-history.server'
import { prisma } from '~/utils/db.server'
import { getUserAuthorNames } from '~/utils/emergency-sign-in-link/get-user-author-names.server'
import { getValidEmergencySignInLink } from '~/utils/emergency-sign-in-link/get-valid-emergency-sign-in-link.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'
import { isEmergencySignInEnabled } from '~/utils/is-emergency-sign-in-enabled.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canDeleteUser } from '~/utils/permissions/user/guards/can-delete-user'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'
import { canIssueEmergencySignInLink } from '~/utils/permissions/user/guards/can-issue-emergency-sign-in-link'
import { getRecentSignInAttempts } from '~/utils/sign-in-attempts/get-recent-sign-in-attempts.server'
import { describeSignInMethods } from '~/utils/sign-in-methods/describe-sign-in-methods'
import { getSignInMethodSummary } from '~/utils/sign-in-methods/get-sign-in-method-summary.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['view', 'update', 'delete'],
    entities: ['user'],
  })

  const user = await prisma.user.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
      createdAt: true,
      email: true,
      id: true,
      role: {
        select: {
          level: true,
          name: true,
        },
      },
    },
    where: { id: userId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'user',
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  const target = {
    targetUserId: user.id,
    targetUserRoleLevel: user.role.level,
  }

  // Only during a Google outage (#578, design 28e).
  const isEmergencyMode = isEmergencySignInEnabled()

  const [signInMethodSummary, signInAttempts, history, emergencyLink] =
    await Promise.all([
      getSignInMethodSummary(user.id),
      getRecentSignInAttempts({ email: user.email, userId: user.id }),
      getAccountHistory({ authorId: user.author.id, userId: user.id }),
      isEmergencyMode ? getValidEmergencySignInLink(user.id) : null,
    ])

  const emergencyLinkIssuerNames = await getUserAuthorNames(
    emergencyLink === null ? [] : [emergencyLink.issuedById],
  )

  return {
    canDelete: canDeleteUser(context, target),
    canIssueEmergencyLink:
      isEmergencyMode && canIssueEmergencySignInLink(context, target),
    canUpdate: canEditUser(context, target),
    // The link that still works, as a row of Přihlášení; a deleted issuer
    // leaves the name out (by062t6n).
    emergencyLink:
      emergencyLink === null
        ? null
        : {
            expiresAt: formatTime(emergencyLink.expiresAt),
            issuedAt: formatTime(emergencyLink.createdAt),
            issuerName:
              emergencyLinkIssuerNames.get(emergencyLink.issuedById) ?? null,
          },
    history,
    signInAttempts,
    // Read-only: only the account's owner changes them, in Settings (28e).
    signInMethods: describeSignInMethods(signInMethodSummary, {
      isPasswordSignInAllowed: isEmergencyMode,
    }),
    user: {
      author: user.author,
      createdAt: formatNumericDate(user.createdAt),
      email: user.email,
      id: user.id,
      role: user.role,
    },
  }
}

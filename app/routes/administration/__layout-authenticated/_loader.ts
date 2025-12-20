import { data } from 'react-router'

import type { AdministrationPanelUser } from '~/components/administration-panel'
import { requireAuthentication } from '~/utils/auth.server'
import { commitCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [csrfToken, csrfCookie] = await commitCSRF(request)

  const { isAuthenticated, sessionId } = await requireAuthentication(request)

  let administrationPanelUser: AdministrationPanelUser = {
    email: undefined,
    image: {
      altText: undefined,
      id: undefined,
    },
    name: undefined,
  }

  if (sessionId !== undefined) {
    const session = await prisma.session.findUnique({
      select: {
        id: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      where: {
        id: sessionId,
      },
    })

    if (session) {
      administrationPanelUser = {
        email: session.user.email ?? undefined,
        image: {
          altText: undefined,
          id: undefined,
        },
        name: session.user.name ?? undefined,
      }
    }
  }

  // Get permission contexts if authenticated
  let permissions = {
    canViewArticles: false,
    canViewAuthors: false,
    canViewEditorialBoard: false,
    canViewIssues: false,
    canViewPodcasts: false,
    canViewUsers: false,
  }

  if (isAuthenticated) {
    try {
      const [authorContext, userContext] = await Promise.all([
        getAuthorPermissionContext(request, {
          actions: ['view'],
          entities: [
            'article',
            'podcast',
            'issue',
            'editorial_board_position',
            'editorial_board_member',
          ],
        }),
        getUserPermissionContext(request, {
          actions: ['view'],
          entities: ['user', 'author'],
        }),
      ])

      permissions = {
        canViewArticles: authorContext.can({
          action: 'view',
          entity: 'article',
        }).hasPermission,
        canViewAuthors: userContext.can({
          action: 'view',
          entity: 'author',
          targetUserId: userContext.userId,
        }).hasPermission,
        canViewEditorialBoard:
          authorContext.can({
            action: 'view',
            entity: 'editorial_board_position',
          }).hasPermission ||
          authorContext.can({
            action: 'view',
            entity: 'editorial_board_member',
          }).hasPermission,
        canViewIssues: authorContext.can({ action: 'view', entity: 'issue' })
          .hasPermission,
        canViewPodcasts: authorContext.can({
          action: 'view',
          entity: 'podcast',
        }).hasPermission,
        canViewUsers: userContext.can({
          action: 'view',
          entity: 'user',
          targetUserId: userContext.userId,
        }).hasPermission,
      }
    } catch (error) {
      // If permission check fails, user might not have author role
      // Leave all permissions as false
      console.error('Failed to load permissions:', error)
    }
  }

  return data(
    {
      csrfToken,
      isAuthenticated,
      permissions,
      user: administrationPanelUser,
    },
    {
      headers: {
        ...(csrfCookie ? { 'Set-Cookie': csrfCookie } : {}),
      },
    },
  )
}

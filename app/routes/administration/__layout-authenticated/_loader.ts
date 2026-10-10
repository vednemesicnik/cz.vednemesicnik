import { data } from 'react-router'

import type { SidebarUser } from '~/components/admin/administration-sidebar'
import { requireAuthentication } from '~/utils/auth.server'
import { commitCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import type { Route } from './+types/route'
import { canListPeople } from './utils/can-list-people'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const [csrfToken, csrfCookie] = await commitCSRF(request)

  const { isAuthenticated, sessionId } = await requireAuthentication({
    request,
    url,
  })

  let user: SidebarUser = {
    image: createImageSources('user-image', undefined),
    name: '',
    roleLabel: undefined,
  }

  if (sessionId !== undefined) {
    const session = await prisma.session.findUnique({
      select: {
        id: true,
        user: {
          select: {
            author: {
              select: { name: true, role: { select: { name: true } } },
            },
            email: true,
            image: { select: imageSourceSelect },
          },
        },
      },
      where: {
        id: sessionId,
      },
    })

    if (session) {
      user = {
        image: createImageSources('user-image', session.user.image),
        // The name belongs to the author (design 28f, 29b).
        name: session.user.author.name || session.user.email,
        roleLabel: getAuthorRoleLabel(session.user.author.role.name),
      }
    }
  }

  // Get permission contexts if authenticated
  let permissions = {
    canViewArticles: false,
    canViewAuthors: false,
    canViewIssues: false,
    canViewPodcasts: false,
    canViewUsers: false,
  }

  if (isAuthenticated) {
    try {
      const [authorContext, userContext] = await Promise.all([
        getAuthorPermissionContext(request, {
          actions: ['view'],
          entities: ['article', 'podcast', 'issue'],
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
        canViewAuthors: canListPeople(userContext, 'author'),
        canViewIssues: authorContext.can({ action: 'view', entity: 'issue' })
          .hasPermission,
        canViewPodcasts: authorContext.can({
          action: 'view',
          entity: 'podcast',
        }).hasPermission,
        canViewUsers: canListPeople(userContext, 'user'),
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
      user,
    },
    {
      headers: {
        ...(csrfCookie ? { 'Set-Cookie': csrfCookie } : {}),
      },
    },
  )
}

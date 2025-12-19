import { data, type LoaderFunctionArgs } from "react-router"

import type { AdministrationPanelUser } from "~/components/administration-panel"
import { getAuthentication } from "~/utils/auth.server"
import { commitCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [csrfToken, csrfCookie] = await commitCSRF(request)

  const { isAuthenticated, sessionId } = await getAuthentication(request)

  let administrationPanelUser: AdministrationPanelUser = {
    name: undefined,
    email: undefined,
    image: {
      id: undefined,
      altText: undefined,
    },
  }

  if (sessionId !== undefined) {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (session) {
      administrationPanelUser = {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: {
          id: undefined,
          altText: undefined,
        },
      }
    }
  }

  // Get permission contexts if authenticated
  let permissions = {
    canViewUsers: false,
    canViewAuthors: false,
    canViewArticles: false,
    canViewPodcasts: false,
    canViewIssues: false,
    canViewEditorialBoard: false,
  }

  if (isAuthenticated) {
    try {
      const [authorContext, userContext] = await Promise.all([
        getAuthorPermissionContext(request, {
          entities: [
            "article",
            "podcast",
            "issue",
            "editorial_board_position",
            "editorial_board_member",
          ],
          actions: ["view"],
        }),
        getUserPermissionContext(request, {
          entities: ["user", "author"],
          actions: ["view"],
        }),
      ])

      permissions = {
        canViewUsers: userContext.can({
          entity: "user",
          action: "view",
          targetUserId: userContext.userId,
        }).hasPermission,
        canViewAuthors: userContext.can({
          entity: "author",
          action: "view",
          targetUserId: userContext.userId,
        }).hasPermission,
        canViewArticles: authorContext.can({
          entity: "article",
          action: "view",
        }).hasPermission,
        canViewPodcasts: authorContext.can({
          entity: "podcast",
          action: "view",
        }).hasPermission,
        canViewIssues: authorContext.can({ entity: "issue", action: "view" })
          .hasPermission,
        canViewEditorialBoard:
          authorContext.can({
            entity: "editorial_board_position",
            action: "view",
          }).hasPermission ||
          authorContext.can({
            entity: "editorial_board_member",
            action: "view",
          }).hasPermission,
      }
    } catch (error) {
      // If permission check fails, user might not have author role
      // Leave all permissions as false
      console.error("Failed to load permissions:", error)
    }
  }

  return data(
    {
      isAuthenticated,
      user: administrationPanelUser,
      csrfToken,
      permissions,
    },
    {
      headers: {
        ...(csrfCookie ? { "Set-Cookie": csrfCookie } : {}),
      },
    }
  )
}

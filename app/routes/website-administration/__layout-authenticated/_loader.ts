import { data, type LoaderFunctionArgs } from "react-router"

import type { AdministrationPanelUser } from "~/components/administration-panel"
import { getAuthentication } from "~/utils/auth.server"
import { commitCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

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

  return data(
    {
      isAuthenticated,
      user: administrationPanelUser,
      csrfToken,
    },
    {
      headers: {
        ...(csrfCookie ? { "Set-Cookie": csrfCookie } : {}),
      },
    }
  )
}

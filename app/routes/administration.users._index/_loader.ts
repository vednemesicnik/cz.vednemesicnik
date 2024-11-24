import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import { type PermissionEntity } from "~~/types/permission"

import { validateEntry } from "./utils/validate-entry.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const entities: PermissionEntity[] = [
    "user_owner",
    "user_administrator",
    "user_editor",
    "user_author",
    "user_contributor",
  ] as const

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              name: true,
              permissions: {
                where: {
                  entity: { in: entities },
                },
                select: {
                  action: true,
                  access: true,
                  entity: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const rights = getRights(session.user.role.permissions, {
    entities,
    actions: ["read"],
    access: ["any", "own"],
  })

  validateEntry(...rights)

  const [
    canReadUserOwner,
    canReadUserAdministrator,
    canReadUserEditor,
    canReadUserAuthor,
    canReadUserContributor,
  ] = rights

  const users = await prisma.user.findMany({
    where: {
      role: {
        name: {
          in: [
            ...(canReadUserOwner ? ["owner"] : []),
            ...(canReadUserAdministrator ? ["administrator"] : []),
            ...(canReadUserEditor ? ["editor"] : []),
            ...(canReadUserAuthor ? ["author"] : []),
            ...(canReadUserContributor ? ["contributor"] : []),
          ],
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return json({ users, session })
}

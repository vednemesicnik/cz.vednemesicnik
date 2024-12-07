import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import { throwDbError } from "~/utils/throw-db-error.server"
import { type UserPermissionEntity } from "~~/types/permission"
import { type UserRoleName } from "~~/types/role"

export const deleteUser = async (id: string, sessionId: string) => {
  const userToDeletePromise = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { role: { select: { name: true } } },
  })

  const entities: UserPermissionEntity[] = ["user"]

  const sessionPromise = await prisma.session.findUniqueOrThrow({
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

  const [userToDelete, session] = await Promise.all([
    userToDeletePromise,
    sessionPromise,
  ])

  const ownerCanDeleteRoles: UserRoleName[] = ["owner", "administrator", "user"]
  const administratorCanDeleteRoles: UserRoleName[] = ["administrator", "user"]

  let canDeleteUser = false

  if (
    session.user.role.name === "owner" &&
    ownerCanDeleteRoles.includes(userToDelete.role.name as UserRoleName)
  ) {
    canDeleteUser = true
  }

  if (
    session.user.role.name === "administrator" &&
    administratorCanDeleteRoles.includes(userToDelete.role.name as UserRoleName)
  ) {
    canDeleteUser = true
  }

  const [[hasDeleteRight]] = getRights(session.user.role.permissions, {
    actions: ["delete"],
    access: ["any", "own"],
  })

  invariantResponse(
    hasDeleteRight && canDeleteUser,
    "You do not have the permission to delete the user.",
    {
      status: 403,
    }
  )

  try {
    await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user.")
  }
}

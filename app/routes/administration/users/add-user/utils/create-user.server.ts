import { invariantResponse } from "@epic-web/invariant"
import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import { throwDbError } from "~/utils/throw-db-error.server"
import {
  type UserPermissionAction,
  type UserPermissionEntity,
} from "~~/types/permission"
import { type UserRoleName } from "~~/types/role"

type Data = {
  email: string
  name: string
  password: string
  roleId: string
}

export const createUser = async (
  { email, name, password, roleId }: Data,
  sessionId: string
) => {
  const roleToAssignPromise = prisma.userRole.findUniqueOrThrow({
    where: { id: roleId },
    select: {
      name: true,
    },
  })

  const entities: UserPermissionEntity[] = ["user"]
  const actions: UserPermissionAction[] = ["create"]

  const sessionPromise = prisma.session.findUniqueOrThrow({
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
                  action: { in: actions },
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

  const [roleToAssign, session] = await Promise.all([
    roleToAssignPromise,
    sessionPromise,
  ])

  const [[hasCreateRight]] = getRights(session.user.role.permissions, {
    access: ["own", "any"],
  })

  const ownerCanCreateRoles: UserRoleName[] = ["owner", "administrator", "user"]
  const administratorCanCreateRoles: UserRoleName[] = ["administrator", "user"]

  let canCreateUser = false

  if (
    session.user.role.name === "owner" &&
    ownerCanCreateRoles.includes(roleToAssign.name as UserRoleName)
  ) {
    canCreateUser = true
  }

  if (
    session.user.role.name === "administrator" &&
    administratorCanCreateRoles.includes(roleToAssign.name as UserRoleName)
  ) {
    canCreateUser = true
  }

  invariantResponse(
    canCreateUser && hasCreateRight,
    "You do not have the necessary permissions to create a user.",
    { status: 403 }
  )

  try {
    await prisma.$transaction(async (prisma) => {
      const author = await prisma.author.create({
        data: {
          name,
          role: {
            connect: {
              name: "author",
            },
          },
        },
      })

      await prisma.user.create({
        data: {
          email,
          username: email,
          name,
          password: {
            create: {
              hash: bcrypt.hashSync(password, 10),
            },
          },
          role: {
            connect: {
              id: roleId,
            },
          },
          author: {
            connect: {
              id: author.id,
            },
          },
        },
      })
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to create the user.")
  }
}

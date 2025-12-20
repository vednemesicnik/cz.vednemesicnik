import type { PrismaClient } from "@generated/prisma/client"
import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
  type AuthorRoleName,
  type ContentState,
} from "@generated/prisma/enums"

export type AuthorRolesData = {
  name: AuthorRoleName
  level: number
  permissions: {
    entity: AuthorPermissionEntity
    access: AuthorPermissionAccess
    actions: AuthorPermissionAction[]
    state: ContentState
  }[]
}[]

export const createAuthorRoles = async (
  prisma: PrismaClient,
  data: AuthorRolesData
) => {
  for (const role of data) {
    await prisma.authorRole
      .create({
        data: {
          name: role.name,
          level: role.level,
          permissions: {
            connect: await prisma.authorPermission.findMany({
              where: {
                OR: role.permissions.map((permission) => ({
                  entity: permission.entity,
                  access: permission.access,
                  action: { in: permission.actions },
                  state: permission.state,
                })),
              },
            }),
          },
        },
      })
      .catch((error) => {
        console.error("Error creating a role:", error)
        return null
      })
  }
}

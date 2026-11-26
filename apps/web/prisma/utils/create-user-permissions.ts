import type { PrismaClient } from '@generated/prisma/client'
import type {
  UserPermissionAccess,
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'

export type UserPermissionsData = {
  entities: UserPermissionEntity[]
  actions: UserPermissionAction[]
  accesses: UserPermissionAccess[]
}

export const createUserPermissions = async (
  prisma: PrismaClient,
  data: UserPermissionsData,
) => {
  for (const entity of data.entities) {
    for (const access of data.accesses) {
      for (const action of data.actions) {
        await prisma.userPermission
          .create({ data: { access, action, entity } })
          .catch((error) => {
            console.error('Error creating a permission:', error)
            return null
          })
      }
    }
  }
}

import type { PrismaClient } from '@generated/prisma/client'
import type {
  AuthorPermissionAccess,
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

export type AuthorPermissionsData = {
  entities: AuthorPermissionEntity[]
  actions: AuthorPermissionAction[]
  accesses: AuthorPermissionAccess[]
  states: ContentState[]
}

export const createAuthorPermissions = async (
  prisma: PrismaClient,
  data: AuthorPermissionsData,
) => {
  for (const entity of data.entities) {
    for (const state of data.states) {
      for (const access of data.accesses) {
        for (const action of data.actions) {
          await prisma.authorPermission
            .create({ data: { access, action, entity, state } })
            .catch((error) => {
              console.error('Error creating a permission:', error)
              return null
            })
        }
      }
    }
  }
}

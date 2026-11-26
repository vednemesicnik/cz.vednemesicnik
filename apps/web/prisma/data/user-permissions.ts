import type { UserPermissionsData } from '~~/utils/create-user-permissions'

export const userPermissions: UserPermissionsData = {
  accesses: ['own', 'any'],
  actions: ['view', 'create', 'update', 'delete'],
  entities: ['user', 'author'],
}

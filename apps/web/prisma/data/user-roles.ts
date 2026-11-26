import type { UserRolesData } from '~~/utils/create-user-roles'

export const userRoles: UserRolesData = [
  {
    level: 3,
    name: 'member',
    permissions: [
      {
        access: 'own',
        actions: ['view', 'update'],
        entity: 'user',
      },
      {
        access: 'own',
        actions: ['view', 'update'],
        entity: 'author',
      },
    ],
  },
  {
    level: 2,
    name: 'administrator',
    permissions: [
      {
        access: 'any',
        actions: ['view', 'create', 'update', 'delete'],
        entity: 'user',
      },
      {
        access: 'any',
        actions: ['view', 'create', 'update', 'delete'],
        entity: 'author',
      },
    ],
  },
  {
    level: 1,
    name: 'owner',
    permissions: [
      {
        access: 'any',
        actions: ['view', 'create', 'update', 'delete'],
        entity: 'user',
      },
      {
        access: 'any',
        actions: ['view', 'create', 'update', 'delete'],
        entity: 'author',
      },
    ],
  },
]

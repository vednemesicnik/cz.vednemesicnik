import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

export async function getAuthorsByPermission(
  context: AuthorPermissionContext,
  entity: AuthorPermissionEntity,
  action: AuthorPermissionAction,
  state?: ContentState,
) {
  const { hasAny } = context.can({
    action,
    entity,
    state,
  })

  return prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
    where: hasAny ? {} : { id: context.authorId },
  })
}

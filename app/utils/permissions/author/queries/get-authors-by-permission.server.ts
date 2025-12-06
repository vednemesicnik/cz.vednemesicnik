import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from "@generated/prisma/enums"
import { prisma } from "~/utils/db.server"

import type { AuthorPermissionContext } from "../context/get-author-permission-context.server"

export async function getAuthorsByPermission(
  context: AuthorPermissionContext,
  entity: AuthorPermissionEntity,
  action: AuthorPermissionAction,
  state?: ContentState
) {
  const { hasAny } = context.can({
    entity,
    action,
    state,
  })

  return prisma.author.findMany({
    where: hasAny ? {} : { id: context.authorId },
    select: {
      id: true,
      name: true,
    },
  })
}

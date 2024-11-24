import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { getRights } from "~/utils/permissions"
import { throwDbError } from "~/utils/throw-db-error.server"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

export const deleteArchivedIssue = async (id: string, sessionId: string) => {
  const archivedIssuePromise = prisma.archivedIssue.findUniqueOrThrow({
    where: { id },
    select: {
      authorId: true,
    },
  })

  const entities: AuthorPermissionEntity[] = ["archived_issue"]
  const actions: AuthorPermissionAction[] = ["delete"]

  const authorPromise = getAuthorForPermissionCheck(sessionId, {
    entities,
    actions,
  })

  const [archivedIssue, author] = await Promise.all([
    archivedIssuePromise,
    authorPromise,
  ])

  const [hasDeleteRight] = getRights(author.permissions, {
    access: ["any", "own"],
    ownId: author.id,
    targetId: archivedIssue.authorId,
  })

  invariantResponse(
    hasDeleteRight,
    "You do not have the permission to delete the archived issue."
  )

  try {
    await prisma.archivedIssue.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the archived issue.")
  }
}

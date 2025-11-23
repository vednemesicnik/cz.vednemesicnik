import { checkDeleteRights } from "~/routes/website-administration/administration/archive/index/utils/check-delete-rights.server"
import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { throwDbError } from "~/utils/throw-db-error.server"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

export const deleteArchivedIssue = async (id: string, sessionId: string) => {
  const issuePromise = prisma.issue.findUniqueOrThrow({
    where: { id },
    select: {
      authorId: true,
      state: true,
    },
  })

  const entities: AuthorPermissionEntity[] = ["issue"]
  const actions: AuthorPermissionAction[] = ["delete"]

  const authorPromise = getAuthorForPermissionCheck(sessionId, {
    entities,
    actions,
  })

  const [issue, author] = await Promise.all([issuePromise, authorPromise])

  checkDeleteRights({ author, issue })

  try {
    await prisma.issue.delete({
      where: { id },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the archived issue.")
  }
}

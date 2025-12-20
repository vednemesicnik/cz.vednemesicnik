import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, data, href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import { getSchema } from "./_schema"
import { updatePosition } from "./utils/update-position.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  const submission = await parseWithZod(formData, {
    schema: getSchema(editorialBoardPositionsCount),
    async: true,
  })

  if (submission.status !== "success") {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) }
    )
  }

  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_position"],
    actions: ["update"],
  })

  const currentPosition = await prisma.editorialBoardPosition.findUniqueOrThrow(
    {
      where: { id: submission.value.id },
      select: {
        state: true,
        author: {
          select: {
            id: true,
          },
        },
      },
    }
  )

  // Check if author can update this position
  checkAuthorPermission(context, {
    entity: "editorial_board_position",
    action: "update",
    state: currentPosition.state,
    targetAuthorId: currentPosition.author.id,
  })

  const { positionId } = await updatePosition(submission.value)

  return redirect(
    href("/administration/editorial-board/positions/:positionId", {
      positionId,
    })
  )
}

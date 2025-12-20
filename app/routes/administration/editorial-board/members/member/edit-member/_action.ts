import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, data, href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import { schema } from "./_schema"
import { updateMember } from "./utils/update-member.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) }
    )
  }

  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_member"],
    actions: ["update"],
  })

  const currentMember = await prisma.editorialBoardMember.findUniqueOrThrow({
    where: { id: submission.value.id },
    select: {
      state: true,
      author: {
        select: {
          id: true,
        },
      },
    },
  })

  // Check if author can update this member
  checkAuthorPermission(context, {
    entity: "editorial_board_member",
    action: "update",
    state: currentMember.state,
    targetAuthorId: currentMember.author.id,
  })

  const { memberId } = await updateMember(submission.value)

  return redirect(
    href("/administration/editorial-board/members/:memberId", { memberId })
  )
}

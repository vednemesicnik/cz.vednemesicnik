import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, data, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"
import { checkUserPermission } from "~/utils/permissions/user/guards/check-user-permission.server"

import { schema } from "./_schema"
import { changePassword } from "./utils/change-password.server"

export const action = async ({ request }: ActionFunctionArgs) => {
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

  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["update"],
  })

  const { userId, newPassword } = submission.value

  // Verify that the user is changing their own password
  if (userId !== context.userId) {
    throw new Response("Forbidden: You can only change your own password", {
      status: 403,
    })
  }

  // Check permission to update own user account
  checkUserPermission(context, {
    entity: "user",
    action: "update",
    targetUserId: userId,
  })

  await changePassword(userId, newPassword)

  return redirect(`/administration/settings/profile`)
}

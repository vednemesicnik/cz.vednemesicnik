import { parseWithZod } from "@conform-to/zod"
import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs, data, href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"
import { checkUserPermission } from "~/utils/permissions/user/guards/check-user-permission.server"

import { schema } from "./_schema"
import { updateUser } from "./utils/update-user"

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

  // Get the target user's current role and the new role being assigned
  const [targetUser, newRole] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: submission.value.userId },
      select: {
        id: true,
        role: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    }),
    prisma.userRole.findUniqueOrThrow({
      where: { id: submission.value.roleId },
      select: {
        name: true,
        level: true,
      },
    }),
  ])

  // Prevent Owner from changing their own role
  const isEditingSelf = targetUser.id === context.userId
  const isOwner = targetUser.role.name === "owner"
  const isChangingRole = targetUser.role.name !== newRole.name

  invariantResponse(
    !(isEditingSelf && isOwner && isChangingRole),
    "Owner nemůže změnit svou vlastní roli. V systému musí vždy existovat alespoň jeden Owner."
  )

  // Check if user can update this user with their current role
  checkUserPermission(context, {
    entity: "user",
    action: "update",
    targetUserId: targetUser.id,
    targetUserRoleLevel: targetUser.role.level,
  })

  // Check if user can assign the new role
  checkUserPermission(context, {
    entity: "user",
    action: "update",
    targetUserId: targetUser.id,
    targetUserRoleLevel: newRole.level,
  })

  await updateUser(submission.value)

  return redirect(
    href("/administration/users/:userId", { userId: submission.value.userId })
  )
}

import { type LoaderFunctionArgs } from "react-router"

import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"
import { getAssignableRoles } from "~/utils/permissions/user/queries/get-assignable-roles.server"

import { getAuthorsWithoutUser } from "./utils/get-authors-without-user.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["create"],
  })

  // Check create permission
  const canCreate = context.can({
    entity: "user",
    action: "create",
    targetUserId: context.userId,
  }).hasPermission

  // If user cannot create users, they shouldn't access this page
  if (!canCreate) {
    throw new Response("Forbidden", { status: 403 })
  }

  const [roles, authorsWithoutUser] = await Promise.all([
    getAssignableRoles(context),
    getAuthorsWithoutUser(),
  ])

  return { roles, authorsWithoutUser }
}

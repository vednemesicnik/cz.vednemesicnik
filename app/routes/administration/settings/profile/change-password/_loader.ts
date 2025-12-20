import { type LoaderFunctionArgs } from "react-router"

import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    entities: ["user"],
    actions: ["update"],
  })

  // Check if user can update their own profile
  const canUpdate = context.can({
    entity: "user",
    action: "update",
    targetUserId: context.userId,
  }).hasPermission

  if (!canUpdate) {
    throw new Response("Forbidden", { status: 403 })
  }

  return { userId: context.userId }
}

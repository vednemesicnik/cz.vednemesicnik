import { type LoaderFunctionArgs } from "react-router"

import { getAllAuthorRoles } from "~/utils/permissions/author/queries/get-all-author-roles.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    entities: ["author"],
    actions: ["create"],
  })

  // Check create permission
  const canCreate = context.can({
    entity: "author",
    action: "create",
  }).hasPermission

  // If user cannot create authors, they shouldn't access this page
  if (!canCreate) {
    throw new Response("Forbidden", { status: 403 })
  }

  const roles = await getAllAuthorRoles()

  return { roles }
}
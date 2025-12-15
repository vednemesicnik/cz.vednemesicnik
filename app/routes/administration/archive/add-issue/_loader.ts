import { href } from "react-router"

import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { requireAuthorPermission } from "~/utils/permissions/author/guards/require-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
    actions: ["create"],
  })

  requireAuthorPermission(context, {
    entity: "issue",
    action: "create",
    state: "draft",
    targetAuthorId: context.authorId,
    redirectTo: href("/administration/archive"),
  })

  const authors = await getAuthorsByPermission(
    context,
    "issue",
    "create",
    "draft"
  )

  return {
    authors,
    selfAuthorId: context.authorId,
  }
}

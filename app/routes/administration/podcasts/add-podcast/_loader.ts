import { href } from "react-router"

import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { requireAuthorPermission } from "~/utils/permissions/author/guards/require-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast"],
    actions: ["create"],
  })

  requireAuthorPermission(context, {
    entity: "podcast",
    action: "create",
    state: "draft",
    targetAuthorId: context.authorId,
    redirectTo: href("/administration/podcasts"),
  })

  const authors = await getAuthorsByPermission(
    context,
    "podcast",
    "create",
    "draft"
  )

  return {
    authors,
    selfAuthorId: context.authorId,
  }
}

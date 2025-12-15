import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { requireAuthorPermission } from "~/utils/permissions/author/guards/require-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
    actions: ["update"],
  })

  const issue = await prisma.issue.findUniqueOrThrow({
    where: { id: params.issueId },
    select: {
      id: true,
      label: true,
      releasedAt: true,
      state: true,
      publishedAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
        },
      },
      cover: {
        select: {
          id: true,
        },
      },
      pdf: {
        select: {
          id: true,
        },
      },
    },
  })

  requireAuthorPermission(context, {
    entity: "issue",
    action: "update",
    state: issue.state,
    targetAuthorId: issue.authorId,
    redirectTo: href("/administration/archive/:issueId", { issueId: issue.id }),
  })

  const authors = await getAuthorsByPermission(
    context,
    "issue",
    "update",
    issue.state
  )

  return {
    issue,
    authors,
  }
}

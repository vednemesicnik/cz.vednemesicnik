import { parseWithZod } from "@conform-to/zod"
import { href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"
import { schema } from "./_schema"
import { updateEpisode } from "./utils/update-episode.server"

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const { episodeId, podcastId, number, title, slug, description, authorId } =
    submission.value

  // Get permission context
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode"],
    actions: ["update"],
  })

  // Get existing episode to check current state and author
  const existingEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      state: true,
      authorId: true,
    },
  })

  // Check permission to update THIS specific episode
  checkAuthorPermission(context, {
    entity: "podcast_episode",
    action: "update",
    state: existingEpisode.state,
    targetAuthorId: existingEpisode.authorId,
    errorMessage: "You do not have permission to update this episode.",
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    entity: "podcast_episode",
    action: "update",
    state: existingEpisode.state,
    targetAuthorId: authorId,
    errorMessage:
      "You do not have permission to assign this author to the episode.",
  })

  await updateEpisode({
    id: episodeId,
    number,
    title,
    slug,
    description,
    authorId,
  })

  return redirect(
    href("/administration/podcasts/:podcastId/episodes/:episodeId", {
      podcastId,
      episodeId,
    })
  )
}

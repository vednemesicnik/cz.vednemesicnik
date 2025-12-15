import { parseWithZod } from "@conform-to/zod"
import { href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"
import { schema } from "./_schema"
import { updateLink } from "./utils/update-link.server"

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode_link"],
    actions: ["update"],
  })

  const { episodeId, linkId } = params

  // Get episode state and link author to check permissions
  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { state: true },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: { authorId: true },
  })

  const [episode, link] = await Promise.all([episodePromise, linkPromise])

  checkAuthorPermission(context, {
    entity: "podcast_episode_link",
    action: "update",
    state: episode.state,
    targetAuthorId: link.authorId,
  })

  const { label, url } = submission.value

  await updateLink({ linkId, label, url })

  const { podcastId } = submission.value

  return redirect(
    href(
      "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
      {
        podcastId,
        episodeId,
        linkId,
      }
    )
  )
}

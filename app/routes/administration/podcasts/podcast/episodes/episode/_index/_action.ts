import { invariantResponse } from "@epic-web/invariant"
import { href, redirect } from "react-router"

import { FORM_CONFIG } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"
import { archiveEpisode } from "./utils/archive-episode"
import { deleteEpisode } from "./utils/delete-episode"
import { publishEpisode } from "./utils/publish-episode"
import { restoreEpisode } from "./utils/restore-episode"
import { retractEpisode } from "./utils/retract-episode"
import { reviewEpisode } from "./utils/review-episode"

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { podcastId, episodeId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === "string", "Missing intent")

  const withRedirect = formData.get(REDIRECT_NAME) === "true"

  const currentEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { authorId: true, state: true },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })
      break

    case INTENT_VALUE.delete:
      await deleteEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })

      if (withRedirect) {
        throw redirect(
          href("/administration/podcasts/:podcastId/episodes", { podcastId })
        )
      }
      break

    case INTENT_VALUE.publish:
      await publishEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })
      break

    case INTENT_VALUE.restore:
      await restoreEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })
      break

    case INTENT_VALUE.retract:
      await retractEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })
      break

    case INTENT_VALUE.review:
      await reviewEpisode(request, {
        id: episodeId,
        target: currentEpisode,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
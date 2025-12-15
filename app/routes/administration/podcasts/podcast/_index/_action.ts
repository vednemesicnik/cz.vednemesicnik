import { invariantResponse } from "@epic-web/invariant"
import { href, redirect } from "react-router"

import { FORM_CONFIG } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"
import { archivePodcast } from "./utils/archive-podcast"
import { deletePodcast } from "./utils/delete-podcast"
import { publishPodcast } from "./utils/publish-podcast"
import { restorePodcast } from "./utils/restore-podcast"
import { retractPodcast } from "./utils/retract-podcast"
import { reviewPodcast } from "./utils/review-podcast"

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { podcastId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === "string", "Missing intent")

  const withRedirect = formData.get(REDIRECT_NAME) === "true"

  const currentPodcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { authorId: true, state: true },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archivePodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })
      break

    case INTENT_VALUE.delete:
      await deletePodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })

      if (withRedirect) {
        throw redirect(href("/administration/podcasts"))
      }
      break

    case INTENT_VALUE.publish:
      await publishPodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })
      break

    case INTENT_VALUE.restore:
      await restorePodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })
      break

    case INTENT_VALUE.retract:
      await retractPodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })
      break

    case INTENT_VALUE.review:
      await reviewPodcast(request, {
        id: podcastId,
        target: currentPodcast,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}

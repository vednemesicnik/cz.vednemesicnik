import { invariantResponse } from "@epic-web/invariant"
import { href, redirect } from "react-router"

import { FORM_CONFIG } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"
import { archiveLink } from "./utils/archive-link"
import { deleteLink } from "./utils/delete-link"
import { publishLink } from "./utils/publish-link"
import { restoreLink } from "./utils/restore-link"
import { retractLink } from "./utils/retract-link"
import { reviewLink } from "./utils/review-link"

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { podcastId, episodeId, linkId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === "string", "Missing intent")

  const withRedirect = formData.get(REDIRECT_NAME) === "true"

  const currentLink = await prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: { authorId: true, state: true },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveLink(request, {
        id: linkId,
        target: currentLink,
      })
      break

    case INTENT_VALUE.delete:
      await deleteLink(request, {
        id: linkId,
        target: currentLink,
      })

      if (withRedirect) {
        throw redirect(
          href("/administration/podcasts/:podcastId/episodes/:episodeId/links", {
            podcastId,
            episodeId,
          })
        )
      }
      break

    case INTENT_VALUE.publish:
      await publishLink(request, {
        id: linkId,
        target: currentLink,
      })
      break

    case INTENT_VALUE.restore:
      await restoreLink(request, {
        id: linkId,
        target: currentLink,
      })
      break

    case INTENT_VALUE.retract:
      await retractLink(request, {
        id: linkId,
        target: currentLink,
      })
      break

    case INTENT_VALUE.review:
      await reviewLink(request, {
        id: linkId,
        target: currentLink,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
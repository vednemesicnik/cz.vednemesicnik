// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/delete-link/:linkId">,
  string
>

export const loader = async () => {
  return redirect("/")
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { podcastId, episodeId, linkId } = params as RouteParams

  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  void (await prisma.podcastEpisodeLink.delete({
    where: { id: linkId },
  }))

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}

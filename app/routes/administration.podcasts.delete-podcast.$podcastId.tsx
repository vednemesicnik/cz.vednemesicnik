// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/delete/:podcastId">,
  string
>

export const loader = async () => {
  return redirect("/")
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { podcastId } = params as RouteParams

  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  void (await prisma.podcast.delete({
    where: { id: podcastId },
  }))

  return redirect("/administration/podcasts")
}

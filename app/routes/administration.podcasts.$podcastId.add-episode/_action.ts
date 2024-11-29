import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"
import { createEpisode } from "./utils/create-episode.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { lastResult: submission.reply() }
  }

  await createEpisode(submission.value)

  const podcastId = submission.value.podcastId

  return redirect(`/administration/podcasts/${podcastId}`)
}

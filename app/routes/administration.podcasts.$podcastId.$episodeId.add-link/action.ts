import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { createLink } from "~/routes/administration.podcasts.$podcastId.$episodeId.add-link/utils/create-link.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./schema"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await createLink(submission.value)

  const { podcastId, episodeId } = submission.value

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}

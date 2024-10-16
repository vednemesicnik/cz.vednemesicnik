import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { updateLink } from "~/routes/administration.podcasts.$podcastId.$episodeId.edit-link.$linkId/utils/update-link.server"
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

  const { podcastId, episodeId, linkId, label, url } = submission.value

  await updateLink({ linkId, label, url })

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}

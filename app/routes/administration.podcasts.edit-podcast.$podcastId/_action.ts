import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { updatePodcast } from "~/routes/administration.podcasts.edit-podcast.$podcastId/utils/update-podcast.server"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

import { schema } from "./_schema"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await updatePodcast(submission.value)

  return redirect("/administration/podcasts")
}

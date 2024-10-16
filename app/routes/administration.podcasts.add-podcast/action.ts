import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

import { schema } from "./schema"
import { createPodcast } from "./utils/create-podcast.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getMultipartFormData(request)

  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await createPodcast(submission.value)

  return redirect("/administration/podcasts")
}

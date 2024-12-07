import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
// import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

import { schema } from "./_schema"
import { updatePodcast } from "./utils/update-podcast.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getMultipartFormData(request)
  // await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const response = await updatePodcast(submission.value)

  if (response?.ok === true) {
    throw redirect(`/administration/podcasts`)
  }

  return { submissionResult: null }
}

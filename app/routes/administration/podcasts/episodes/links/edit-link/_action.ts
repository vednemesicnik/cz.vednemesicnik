import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
// import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"
import { updateLink } from "./utils/update-link.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  // await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const { podcastId, episodeId, linkId, label, url } = submission.value

  const response = await updateLink({ linkId, label, url })

  if (response?.ok === true) {
    throw redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
  }

  return { submissionResult: null }
}

import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { updateLink } from "~/routes/administration.podcasts.$podcastId.$episodeId.edit-link.$linkId/utils/update-link.server"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"

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

  const { podcastId, episodeId, linkId, label, url } = submission.value

  await updateLink({ linkId, label, url })

  return redirect(`/administration/podcasts/${podcastId}/${episodeId}`)
}

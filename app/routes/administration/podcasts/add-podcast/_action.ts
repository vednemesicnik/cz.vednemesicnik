import { parseWithZod } from "@conform-to/zod"
import { data, href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"
import { schema } from "./_schema"
import { createPodcast } from "./utils/create-podcast.server"

export async function action({ request }: Route.ActionArgs) {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) }
    )
  }

  const { title, slug, description, cover, authorId } = submission.value

  // Check permissions
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast"],
    actions: ["create"],
  })

  checkAuthorPermission(context, {
    entity: "podcast",
    action: "create",
    state: "draft",
    targetAuthorId: authorId,
  })

  const { podcastId } = await createPodcast({
    title,
    slug,
    description,
    cover,
    authorId,
  })

  return redirect(href("/administration/podcasts/:podcastId", { podcastId }))
}

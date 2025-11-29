import { parseWithZod } from "@conform-to/zod"
import { data, href, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"

import type { Route } from "./+types/route"
import { schema } from "./_schema"
import { createArchivedIssue } from "./utils/create-archived-issue.server"

export const action = async ({ request }: Route.ActionArgs) => {
  const { sessionId } = await requireAuthentication(request)

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

  const response = await createArchivedIssue(submission.value, sessionId)

  if (response?.ok === true) {
    throw redirect(href("/administration/archive"))
  }

  return data({ submissionResult: null })
}

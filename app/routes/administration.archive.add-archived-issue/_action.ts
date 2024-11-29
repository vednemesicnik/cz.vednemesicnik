import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, data, redirect } from "@remix-run/node"

import { routesConfig } from "~/config/routes-config"
import { schema } from "~/routes/administration.archive.add-archived-issue/_schema"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"

import { createArchivedIssue } from "./utils/create-archived-issue.server"

export const action = async ({ request }: ActionFunctionArgs) => {
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

  await createArchivedIssue(submission.value, sessionId)

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}

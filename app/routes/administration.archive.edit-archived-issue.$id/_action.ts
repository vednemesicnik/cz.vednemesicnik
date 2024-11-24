import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { routesConfig } from "~/config/routes-config"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

import { schema } from "./_schema"
import { updateArchivedIssue } from "./utils/update-archived-issue.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await updateArchivedIssue(submission.value, sessionId)

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}

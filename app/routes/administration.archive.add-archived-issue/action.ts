import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { routesConfig } from "~/config/routes-config"
import { validateCSRF } from "~/utils/csrf.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

import { schema } from "./schema"
import { addArchivedIssue } from "./utils/add-archived-issue.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await addArchivedIssue(submission.value)

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}

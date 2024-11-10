import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs, json } from "@remix-run/node"

import { formConfig } from "~/config/form-config"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { deleteArchivedIssue } from "./utils/delete-archived-issue.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const intent = formData.get(formConfig.intent.name)
  const deleteIntent = formConfig.intent.value.delete

  invariantResponse(intent === deleteIntent, "Invalid intent")

  const id = formData.get("id")

  invariantResponse(typeof id === "string", "Missing archived issue ID")

  await deleteArchivedIssue(id)

  return json({ status: "success" })
}

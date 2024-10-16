import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs, json } from "@remix-run/node"

import { formConfig } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"

import { deleteArchivedIssue } from "./utils/delete-archived-issue.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const deleteAction = formConfig.intent.value.delete

  invariantResponse(intent === deleteAction, "Invalid intent")

  const id = formData.get(formConfig.field.name.archivedIssueId)

  invariantResponse(typeof id === "string", "Missing archived issue ID")

  await deleteArchivedIssue(id)

  return json({ status: "success" })
}

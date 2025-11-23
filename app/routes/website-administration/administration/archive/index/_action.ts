import { invariantResponse } from "@epic-web/invariant"

import { formConfig } from "~/config/form-config"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import type { Route } from "./+types/route"
import { deleteArchivedIssue } from "./utils/delete-archived-issue.server"

export const action = async ({ request }: Route.ActionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const deleteIntent = formConfig.intent.value.delete

  invariantResponse(intent === deleteIntent, "Invalid intent")

  const id = formData.get("id")

  invariantResponse(typeof id === "string", "Missing archived issue ID")

  await deleteArchivedIssue(id, sessionId)

  return { status: "success" }
}

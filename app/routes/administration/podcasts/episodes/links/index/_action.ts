import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs } from "react-router"

import { formConfig } from "~/config/form-config"
import { requireAuthentication } from "~/utils/auth.server"

import { deleteLink } from "./utils/delete-link.server"
// import { validateCSRF } from "~/utils/csrf.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  // await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const intent = formData.get(formConfig.intent.name)

  invariantResponse(intent === formConfig.intent.value.delete, "Invalid intent")

  const id = formData.get("id")

  invariantResponse(typeof id === "string", "Missing link ID")

  await deleteLink(id)

  return { status: "success" }
}

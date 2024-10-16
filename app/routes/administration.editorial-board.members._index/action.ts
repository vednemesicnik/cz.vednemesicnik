import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs, json } from "@remix-run/node"

import { formConfig } from "~/config/form-config"
import { deleteMemeber } from "~/routes/administration.editorial-board.members._index/utils/delete-memeber.server"
import { validateCSRF } from "~/utils/csrf.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)

  invariantResponse(intent === formConfig.intent.value.delete, "Invalid intent")

  const id = formData.get("id")

  invariantResponse(typeof id === "string", "Missing member ID")

  await deleteMemeber(id)

  return json({ status: "success" })
}

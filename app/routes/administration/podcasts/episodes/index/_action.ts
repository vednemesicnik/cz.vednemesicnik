import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs } from "react-router"

import { formConfig } from "~/config/form-config"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { deleteEpisode } from "./utils/delete-episode.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuthentication(request)

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const deleteAction = formConfig.intent.value.delete

  invariantResponse(intent === deleteAction, "Invalid intent")

  const id = formData.get("id")

  invariantResponse(typeof id === "string", "Missing episode ID")

  await deleteEpisode(id)

  return { status: "success" }
}

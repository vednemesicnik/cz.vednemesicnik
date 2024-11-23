import { invariantResponse } from "@epic-web/invariant"
import { type ActionFunctionArgs, json } from "@remix-run/node"

import { formConfig } from "~/config/form-config"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const intent = formData.get(formConfig.intent.name)
  invariantResponse(intent === formConfig.intent.value.delete, "Invalid intent")

  const userId = formData.get("userId")
  invariantResponse(typeof userId === "string", "Missing user ID")

  const currentSessionId = formData.get("currentSessionId")
  invariantResponse(
    typeof currentSessionId === "string",
    "Missing current session ID"
  )

  try {
    await prisma.session.deleteMany({
      where: {
        userId: userId,
        id: {
          not: currentSessionId,
        },
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user's sessions.")
  }

  return json({ status: "success" })
}

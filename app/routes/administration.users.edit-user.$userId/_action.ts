import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"
import { updateUser } from "./utils/update-user"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await updateUser(submission.value, sessionId)

  return redirect("/administration/users")
}

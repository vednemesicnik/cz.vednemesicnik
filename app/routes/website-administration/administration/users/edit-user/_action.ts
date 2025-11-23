import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"
import { updateUser } from "./utils/update-user"

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuthentication(request)

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const response = await updateUser(submission.value)

  if (response?.ok === true) {
    throw redirect("/administration/users")
  }

  return { submissionResult: null }
}

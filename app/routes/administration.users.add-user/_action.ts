import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { createUser } from "~/routes/administration.users.add-user/utils/create-user.server"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { lastResult: submission.reply() }
  }

  await createUser(submission.value, sessionId)

  return redirect("/administration/users")
}

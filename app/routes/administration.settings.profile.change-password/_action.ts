import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { changePassword } from "~/routes/administration.settings.profile.change-password/utils/change-password.server"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./_schema"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return { lastResult: submission.reply() }
  }

  const { userId, newPassword } = submission.value

  await changePassword(userId, newPassword)

  return redirect(`/administration/settings/profile`)
}

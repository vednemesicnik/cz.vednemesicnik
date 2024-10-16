import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { validateCSRF } from "~/utils/csrf.server"

import { schema } from "./schema"
import { addMember } from "./utils/add-member.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await addMember(submission.value)

  return redirect("/administration/editorial-board/members")
}

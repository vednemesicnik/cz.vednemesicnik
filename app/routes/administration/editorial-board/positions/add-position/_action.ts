import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
// import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

import { getSchema } from "./_schema"
import { addPosition } from "./utils/add-position.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  // await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  const submission = await parseWithZod(formData, {
    schema: getSchema(editorialBoardPositionsCount),
    async: true,
  })

  if (submission.status !== "success") {
    return { submissionResult: submission.reply() }
  }

  const response = await addPosition(submission.value)

  if (response?.ok === true) {
    throw redirect("/administration/editorial-board/positions")
  }

  return { submissionResult: null }
}

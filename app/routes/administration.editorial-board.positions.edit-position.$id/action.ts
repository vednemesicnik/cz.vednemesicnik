import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { updatePosition } from "~/routes/administration.editorial-board.positions.edit-position.$id/utils/update-position.server"
import { requireAuthentication } from "~/utils/auth.server"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

import { getSchema } from "./schema"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)
  await requireAuthentication(request)

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  const submission = await parseWithZod(formData, {
    schema: getSchema(editorialBoardPositionsCount),
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  await updatePosition(submission.value)

  return redirect("/administration/editorial-board/positions")
}

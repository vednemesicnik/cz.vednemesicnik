// noinspection JSUnusedGlobalSymbols

import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"
import { prisma } from "~/utils/db.server"
import { validateCSRF } from "~/utils/csrf.server"

const ROUTE = "archive/delete-issue/:id"
type RouteParams = Record<ParamParseKey<typeof ROUTE>, string>

export const loader = async () => {
  return redirect("/")
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params as RouteParams

  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  void (await prisma.archivedIssue.delete({
    where: { id },
  }))

  return redirect("/archive")
}

// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/members/delete/:id">,
  string
>

export const loader = async () => {
  return redirect("/")
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params as RouteParams

  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  void (await prisma.editorialBoardMember.delete({
    where: { id },
  }))

  return redirect("/administration/editorial-board/members")
}

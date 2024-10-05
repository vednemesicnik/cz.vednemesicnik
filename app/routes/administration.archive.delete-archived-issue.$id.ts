// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { routesConfig } from "~/config/routes-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type DeleteArchivedIssuePath =
  typeof routesConfig.administration.archive.deleteArchivedIssue.dynamicPath

type RouteParams = Record<ParamParseKey<DeleteArchivedIssuePath>, string>

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

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}

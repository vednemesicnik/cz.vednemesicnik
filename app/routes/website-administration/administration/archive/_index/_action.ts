import { invariantResponse } from "@epic-web/invariant"

import { formConfig } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

import type { Route } from "./+types/route"

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const id = formData.get("id")

  invariantResponse(intent === formConfig.intent.value.delete, "Invalid intent")
  invariantResponse(typeof id === "string", "Missing issue ID")

  await withAuthorPermission(request, {
    entity: "issue",
    action: "delete",
    getTarget: () =>
      prisma.issue.findUniqueOrThrow({
        where: { id },
        select: { authorId: true, state: true },
      }),
    execute: () => prisma.issue.delete({ where: { id } }),
  })

  return { status: "success" }
}

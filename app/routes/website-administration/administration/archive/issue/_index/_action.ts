import { invariantResponse } from "@epic-web/invariant"
import { href, redirect } from "react-router"

import { formConfig } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

import type { Route } from "./+types/route"

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const id = formData.get("id") ?? params.issueId

  invariantResponse(typeof id === "string", "Missing issue ID")
  invariantResponse(typeof intent === "string", "Missing intent")

  // Handle delete action
  if (intent === formConfig.intent.value.delete) {
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

    throw redirect(href("/administration/archive"))
  }

  // Handle publish action (draft → published)
  if (intent === "publish") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "publish",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: () =>
        prisma.issue.update({
          where: { id },
          data: { state: "published", publishedAt: new Date() },
        }),
    })
  }

  // Handle retract action (published → draft)
  if (intent === "retract") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "retract",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: () =>
        prisma.issue.update({
          where: { id },
          data: { state: "draft", publishedAt: null },
        }),
    })
  }

  // Handle archive action (published → archived)
  if (intent === "archive") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "archive",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: () =>
        prisma.issue.update({
          where: { id },
          data: { state: "archived" },
        }),
    })
  }

  // Handle restore action (archived → draft)
  if (intent === "restore") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "restore",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: () =>
        prisma.issue.update({
          where: { id },
          data: { state: "draft", publishedAt: null },
        }),
    })
  }

  invariantResponse(
    ["delete", "publish", "retract", "archive", "restore"].includes(intent),
    "Invalid intent"
  )

  return { status: "success" }
}

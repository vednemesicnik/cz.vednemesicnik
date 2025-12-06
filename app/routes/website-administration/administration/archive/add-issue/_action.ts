import { parseWithZod } from "@conform-to/zod"
import { data, href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getIssueData } from "~/utils/get-issue-data"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { getStatusCodeFromSubmissionStatus } from "~/utils/get-status-code-from-submission-status"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"
import { getConvertedImageStream } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) }
    )
  }

  const { ordinalNumber, releasedAt, cover, pdf, authorId } = submission.value

  // Check permissions
  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
    actions: ["create"],
  })

  checkAuthorPermission(context, {
    entity: "issue",
    action: "create",
    state: "draft",
    targetAuthorId: authorId,
  })

  const { releaseDate, label, pdfFileName, coverAltText } = getIssueData(
    ordinalNumber,
    releasedAt
  )

  const convertedCover = await getConvertedImageStream(cover, {
    width: 905,
    height: 1280,
    quality: 80,
    format: "jpeg",
  })

  try {
    const issue = await prisma.issue.create({
      data: {
        label: label,
        releasedAt: releaseDate,
        cover: {
          create: {
            altText: coverAltText,
            contentType: convertedCover.contentType,
            blob: Uint8Array.from(await convertedCover.stream.toBuffer()),
          },
        },
        pdf: {
          create: {
            fileName: pdfFileName,
            contentType: pdf.type,
            blob: await pdf.bytes(),
          },
        },
        authorId: authorId,
      },
    })

    return redirect(
      href("/administration/archive/:issueId", { issueId: issue.id })
    )
  } catch (error) {
    throwDbError(error, "Unable to add the archived issue.")
  }

  return data({ submissionResult: null })
}

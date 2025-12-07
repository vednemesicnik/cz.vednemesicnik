import { parseWithZod } from "@conform-to/zod"
import { createId } from "@paralleldrive/cuid2"
import { href, redirect } from "react-router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getIssueData } from "~/utils/get-issue-data"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
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
    return { submissionResult: submission.reply() }
  }

  const {
    id,
    ordinalNumber,
    releasedAt,
    coverId,
    cover,
    pdfId,
    pdf,
    authorId,
  } = submission.value

  // Get permission context
  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
    actions: ["update"],
  })

  // Get existing issue to check current state and author
  const existingIssue = await prisma.issue.findUniqueOrThrow({
    where: { id },
    select: {
      state: true,
      authorId: true,
    },
  })

  // Check permission to update THIS specific issue
  checkAuthorPermission(context, {
    entity: "issue",
    action: "update",
    state: existingIssue.state,
    targetAuthorId: existingIssue.authorId,
    errorMessage: "You do not have permission to update this issue.",
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    entity: "issue",
    action: "update",
    state: existingIssue.state,
    targetAuthorId: authorId,
    errorMessage:
      "You do not have permission to assign this author to the issue.",
  })

  const { label, releaseDate, coverAltText, pdfFileName } = getIssueData(
    ordinalNumber,
    releasedAt
  )

  const convertedCover = cover
    ? await getConvertedImageStream(cover, {
        width: 905,
        height: 1280,
        quality: 80,
        format: "jpeg",
      })
    : undefined

  try {
    await prisma.issue.update({
      where: { id: id },
      data: {
        label: label,
        releasedAt: releaseDate,
        cover: {
          update: {
            where: { id: coverId },
            data:
              convertedCover !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new image
                    altText: coverAltText,
                    contentType: convertedCover.contentType,
                    blob: Uint8Array.from(
                      await convertedCover.stream.toBuffer()
                    ),
                  }
                : {
                    altText: coverAltText,
                  },
          },
        },
        pdf: {
          update: {
            where: { id: pdfId },
            data:
              pdf !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new PDF
                    fileName: pdfFileName,
                    contentType: pdf.type,
                    blob: await pdf.bytes(),
                  }
                : {
                    fileName: pdfFileName,
                  },
          },
        },
        authorId: authorId,
      },
    })

    return redirect(href("/administration/archive"))
  } catch (error) {
    throwDbError(error, "Unable to update the archived issue.")
  }

  return { submissionResult: null }
}

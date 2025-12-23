import { parseWithZod } from '@conform-to/zod'
import { createId } from '@paralleldrive/cuid2'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getIssueData } from '~/utils/get-issue-data'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { getConvertedImageStream } from '~/utils/sharp.server'
import { throwDbError } from '~/utils/throw-db-error.server'
import { schema } from './_schema'
import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
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
    actions: ['update'],
    entities: ['issue'],
  })

  // Get existing issue to check current state and author
  const existingIssue = await prisma.issue.findUniqueOrThrow({
    select: {
      authorId: true,
      state: true,
    },
    where: { id },
  })

  // Check permission to update THIS specific issue
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    errorMessage: 'You do not have permission to update this issue.',
    state: existingIssue.state,
    targetAuthorId: existingIssue.authorId,
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    errorMessage:
      'You do not have permission to assign this author to the issue.',
    state: existingIssue.state,
    targetAuthorId: authorId,
  })

  const { label, releaseDate, coverAltText, pdfFileName } = getIssueData(
    ordinalNumber,
    releasedAt,
  )

  const convertedCover =
    cover !== undefined
      ? await getConvertedImageStream(cover, {
          format: 'jpeg',
          height: 1280,
          quality: 80,
          width: 905,
        })
      : undefined

  try {
    await prisma.issue.update({
      data: {
        authorId: authorId,
        cover: {
          update: {
            data:
              convertedCover !== undefined
                ? {
                    altText: coverAltText,
                    blob: Uint8Array.from(
                      await convertedCover.stream.toBuffer(),
                    ),
                    contentType: convertedCover.contentType,
                    id: createId(), // New ID forces browser to download new image
                  }
                : {
                    altText: coverAltText,
                  },
            where: { id: coverId },
          },
        },
        label: label,
        pdf: {
          update: {
            data:
              pdf !== undefined
                ? {
                    blob: await pdf.bytes(),
                    contentType: pdf.type,
                    fileName: pdfFileName,
                    id: createId(), // New ID forces browser to download new PDF
                  }
                : {
                    fileName: pdfFileName,
                  },
            where: { id: pdfId },
          },
        },
        releasedAt: releaseDate,
        reviews: {
          deleteMany: {}, // Delete all reviews when issue is updated (content changed, needs re-approval)
        },
      },
      where: { id: id },
    })

    return redirect(href('/administration/archive/:issueId', { issueId: id }))
  } catch (error) {
    throwDbError(error, 'Unable to update the archived issue.')
  }

  return { submissionResult: null }
}

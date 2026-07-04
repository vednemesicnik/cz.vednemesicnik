import { parseWithZod } from '@conform-to/zod/v4'
import { createId } from '@paralleldrive/cuid2'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getIssueData } from '~/utils/get-issue-data'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import {
  deleteImage,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import {
  deletePdfObject,
  PDF_CONTENT_TYPE,
  storePdf,
} from '~/utils/pdf-store/store-pdf.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
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
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const { ordinalNumber, releasedAt, cover, pdf, authorId } = submission.value

  // Check permissions
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['issue'],
  })

  checkAuthorPermission(context, {
    action: 'create',
    entity: 'issue',
    state: 'draft',
    targetAuthorId: authorId,
  })

  const { releaseDate, label, pdfFileName, coverAltText } = getIssueData(
    ordinalNumber,
    releasedAt,
  )

  // Fresh ids up front so the cover/PDF object keys are known before the writes and
  // available to the cleanup in the catch.
  const coverId = createId()
  const pdfId = createId()

  try {
    // Cover variants and the PDF are written to their object stores before the row
    // is committed (files-before-DB); no PDF binary is stored in the DB.
    const coverMeta = await storeImageVariants(coverId, cover)
    await storePdf(pdfId, pdf)

    const issue = await prisma.issue.create({
      data: {
        authorId: authorId,
        cover: {
          create: {
            ...coverMeta,
            altText: coverAltText,
            id: coverId,
          },
        },
        label: label,
        pdf: {
          create: {
            contentType: PDF_CONTENT_TYPE,
            fileName: pdfFileName,
            id: pdfId,
          },
        },
        releasedAt: releaseDate,
      },
    })

    return redirect(
      href('/administration/archive/:issueId', { issueId: issue.id }),
    )
  } catch (error) {
    // A store write or the create may have failed partway; remove both objects
    // best-effort (fresh ids, so deleting them is safe and a no-op when nothing was
    // written) before surfacing the error.
    await Promise.allSettled([deleteImage(coverId), deletePdfObject(pdfId)])
    throwDbError(error, 'Unable to add the archived issue.')
  }

  return data({ submissionResult: null })
}

import { parseWithZod } from '@conform-to/zod/v4'
import { createId } from '@paralleldrive/cuid2'
import { data, href, redirect } from 'react-router'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import {
  deleteImage,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { getIssueCoverAltText } from '~/utils/issue/get-issue-cover-alt-text'
import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'
import {
  deletePdfObject,
  PDF_CONTENT_TYPE,
  storePdf,
} from '~/utils/pdf-store/store-pdf.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { slugify } from '~/utils/slugify'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'
import { throwDbError } from '~/utils/throw-db-error.server'
import { findIssueNumberConflict } from '../utils/find-issue-number-conflict.server'
import { schema } from './_schema'
import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await getMultipartFormData(request)
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

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

  const { year, order, name, supplement, cover, pdf, authorId } =
    submission.value

  // Check permissions
  const context = await getAuthorPermissionContext(request, {
    actions: ['create', 'view'],
    entities: ['issue'],
  })

  checkAuthorPermission(context, {
    action: 'create',
    entity: 'issue',
    state: 'draft',
    targetAuthorIds: [authorId],
  })

  if (await isImageOverPixelBudget(cover)) {
    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { cover: [IMAGE_OVER_PIXEL_BUDGET_MESSAGE] },
        }),
      },
      { status: 400 },
    )
  }

  // An occupied number is said at its field before any file is written (26d).
  const supplementSlug = supplement === undefined ? '' : slugify(supplement)
  const numberKey = { order, supplementSlug, year }
  const replyWithConflict = (conflict: { field: string; message: string }) =>
    data(
      {
        submissionResult: submission.reply({
          fieldErrors: { [conflict.field]: [conflict.message] },
        }),
      },
      { status: 400 },
    )

  const conflict = await findIssueNumberConflict(context, {
    ...numberKey,
    supplement,
  })

  if (conflict !== null) {
    return replyWithConflict(conflict)
  }

  const issueFields = {
    name: name ?? null,
    order,
    supplement: supplement ?? null,
    year,
  }
  const coverAltText = getIssueCoverAltText(issueFields)
  const pdfFileName = getIssuePdfFileName(numberKey)

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
        ...issueFields,
        authorId: authorId,
        cover: {
          create: {
            ...coverMeta,
            altText: coverAltText,
            id: coverId,
          },
        },
        pdf: {
          create: {
            contentType: PDF_CONTENT_TYPE,
            fileName: pdfFileName,
            id: pdfId,
          },
        },
        supplementSlug,
      },
    })

    await recordContentLog(
      { entity: 'issue', entityId: issue.id, events: ['create'] },
      context,
    )
    publishContentEvent(
      { change: 'create', entity: 'issue', entityId: issue.id },
      context,
    )

    return redirect(
      href('/administration/archive/:issueId', { issueId: issue.id }),
    )
  } catch (error) {
    // A store write or the create may have failed partway; remove both objects
    // best-effort (fresh ids, so deleting them is safe and a no-op when nothing was
    // written) before surfacing the error.
    await Promise.allSettled([deleteImage(coverId), deletePdfObject(pdfId)])

    // Taken between the check and the write.
    const raceConflict = isUniqueConstraintError(error)
      ? await findIssueNumberConflict(context, { ...numberKey, supplement })
      : null

    if (raceConflict !== null) {
      return replyWithConflict(raceConflict)
    }

    throwDbError(error, 'Unable to add the archived issue.')
  }

  return data({ submissionResult: null })
}

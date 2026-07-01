import { parseWithZod } from '@conform-to/zod/v4'
import { createId } from '@paralleldrive/cuid2'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getIssueData } from '~/utils/get-issue-data'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { storeImageVariants } from '~/utils/image-store/store-image.server'
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

  // Cover variants are written to the store before the row is committed; the PDF
  // stays an in-DB blob (out of scope for the image store).
  const coverId = createId()
  const coverMeta = await storeImageVariants(coverId, cover)

  try {
    const issue = await prisma.issue.create({
      data: {
        authorId: authorId,
        cover: {
          create: {
            altText: coverAltText,
            id: coverId,
            intrinsicHeight: coverMeta.intrinsicHeight,
            intrinsicWidth: coverMeta.intrinsicWidth,
            placeholderDataUrl: coverMeta.placeholderDataUrl,
            version: coverMeta.version,
          },
        },
        label: label,
        pdf: {
          create: {
            blob: await pdf.bytes(),
            contentType: pdf.type,
            fileName: pdfFileName,
          },
        },
        releasedAt: releaseDate,
      },
    })

    return redirect(
      href('/administration/archive/:issueId', { issueId: issue.id }),
    )
  } catch (error) {
    throwDbError(error, 'Unable to add the archived issue.')
  }

  return data({ submissionResult: null })
}

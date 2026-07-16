import { parseWithZod } from '@conform-to/zod/v4'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getIssueData } from '~/utils/get-issue-data'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { prepareCoverReplacement } from '~/utils/image-store/store-image.server'
import {
  deletePdfObject,
  preparePdfReplacement,
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
    targetAuthorIds: [existingIssue.authorId],
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    errorMessage:
      'You do not have permission to assign this author to the issue.',
    state: existingIssue.state,
    targetAuthorIds: [authorId],
  })

  const { label, releaseDate, coverAltText, pdfFileName } = getIssueData(
    ordinalNumber,
    releasedAt,
  )

  // Remember the current cover version so its files can be removed once the new
  // version is committed (see `prepareCoverReplacement`). Only queried when the
  // cover is actually being replaced.
  const previousCoverVersion =
    cover === undefined
      ? null
      : ((
          await prisma.issueCover.findUnique({
            select: { version: true },
            where: { id: coverId },
          })
        )?.version ?? null)

  const { data: coverData, cleanup } = await prepareCoverReplacement({
    altText: coverAltText,
    coverId,
    file: cover,
    previousVersion: previousCoverVersion,
  })

  // A new PDF is stored under a fresh id before the row is committed; the previous
  // object is dropped by `pdfCleanup` only after the update commits. Without a new
  // file, only the filename changes.
  const { data: pdfData, cleanup: pdfCleanup } = await preparePdfReplacement({
    file: pdf,
    fileName: pdfFileName,
    pdfId,
  })

  try {
    await prisma.issue.update({
      data: {
        authorId: authorId,
        cover: {
          update: {
            data: coverData,
            where: { id: coverId },
          },
        },
        label: label,
        pdf: {
          update: {
            data: pdfData,
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

    // Post-commit, best-effort: run both so a failing store delete can't skip the
    // other, and a cleanup failure doesn't turn an already-committed update into an
    // error (it would only leave an orphaned previous object).
    await Promise.allSettled([cleanup(), pdfCleanup()])

    return redirect(href('/administration/archive/:issueId', { issueId: id }))
  } catch (error) {
    // The post-commit cleanups above use Promise.allSettled and never throw, so
    // reaching here means the update itself failed — the row still points at the
    // previous PDF object and the freshly-written replacement (pdfData.id, set only
    // when a new file was stored) is orphaned. Remove it best-effort before
    // surfacing the error. The cover's new version is intentionally left to the
    // store (its content-hash version may equal the still-referenced one).
    if (pdfData.id) await deletePdfObject(pdfData.id).catch(() => {})
    throwDbError(error, 'Unable to update the archived issue.')
  }

  return { submissionResult: null }
}

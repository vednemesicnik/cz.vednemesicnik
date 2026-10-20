import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import { prepareCoverReplacement } from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { getIssueCoverAltText } from '~/utils/issue/get-issue-cover-alt-text'
import {
  deletePdfObject,
  preparePdfReplacement,
} from '~/utils/pdf-store/store-pdf.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { slugify } from '~/utils/slugify'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'
import { throwDbError } from '~/utils/throw-db-error.server'
import { findIssueNumberConflict } from '../../utils/find-issue-number-conflict.server'
import { getEditedIssuePdfFileName } from '../../utils/get-edited-issue-pdf-file-name'
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
    return { submissionResult: submission.reply() }
  }

  const {
    id,
    year,
    order,
    name,
    supplement,
    coverId,
    cover,
    pdfId,
    pdf,
    authorId,
  } = submission.value

  // Get permission context
  const context = await getAuthorPermissionContext(request, {
    actions: ['update', 'view'],
    entities: ['issue'],
  })

  // Get existing issue to check current state and author
  const existingIssue = await prisma.issue.findUniqueOrThrow({
    select: {
      authorId: true,
      order: true,
      pdf: { select: { fileName: true } },
      state: true,
      submittedAt: true,
      supplementSlug: true,
      year: true,
    },
    where: { id },
  })

  // Check permission to update THIS specific issue
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    state: existingIssue.state,
    targetAuthorIds: [existingIssue.authorId],
  })

  // A submitted draft is locked for its author (design 07d).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: existingIssue.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    state: existingIssue.state,
    targetAuthorIds: [authorId],
  })

  if (cover !== undefined && (await isImageOverPixelBudget(cover))) {
    return {
      submissionResult: submission.reply({
        fieldErrors: { cover: [IMAGE_OVER_PIXEL_BUDGET_MESSAGE] },
      }),
    }
  }

  // An occupied number is said at its field before any file is written (26d).
  const supplementSlug = supplement === undefined ? '' : slugify(supplement)
  const numberKey = { order, supplementSlug, year }
  const replyWithConflict = (conflict: { field: string; message: string }) => ({
    submissionResult: submission.reply({
      fieldErrors: { [conflict.field]: [conflict.message] },
    }),
  })

  const conflict = await findIssueNumberConflict(context, {
    ...numberKey,
    excludeId: id,
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

  const pdfFileName = getEditedIssuePdfFileName(
    { ...existingIssue, pdfFileName: existingIssue.pdf?.fileName ?? null },
    numberKey,
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
    // A Coordinator's correction keeps the approval (design 07d, 26e); the
    // author can't edit a submitted issue at all.
    await prisma.issue.update({
      data: {
        ...issueFields,
        authorId: authorId,
        cover: {
          update: {
            data: coverData,
            where: { id: coverId },
          },
        },
        pdf: {
          update: {
            data: pdfData,
            where: { id: pdfId },
          },
        },
        supplementSlug,
      },
      where: { id: id },
    })

    // A replaced PDF or cover gets its own row beside the edit (26b).
    await recordContentLog(
      {
        entity: 'issue',
        entityId: id,
        events: [
          'update',
          ...(pdf === undefined ? [] : ['pdf_uploaded' as const]),
          ...(cover === undefined ? [] : ['cover_uploaded' as const]),
        ],
      },
      context,
    )
    publishContentEvent(
      { change: 'update', entity: 'issue', entityId: id },
      context,
    )

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

    // Taken between the check and the write.
    const raceConflict = isUniqueConstraintError(error)
      ? await findIssueNumberConflict(context, {
          ...numberKey,
          excludeId: id,
          supplement,
        })
      : null

    if (raceConflict !== null) {
      return replyWithConflict(raceConflict)
    }

    throwDbError(error, 'Unable to update the archived issue.')
  }

  return { submissionResult: null }
}

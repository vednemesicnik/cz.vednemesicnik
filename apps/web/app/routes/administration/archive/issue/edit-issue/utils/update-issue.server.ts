import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { canChooseRecordAuthor } from '~/routes/administration/articles/utils/can-choose-record-author'
import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { getIssueCoverAltText } from '~/utils/issue/get-issue-cover-alt-text'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { slugify } from '~/utils/slugify'
import { findPublishedNumberConflict } from '../../../utils/find-published-number-conflict.server'

type IssueNumber = {
  year: number | null
  order: number | null
  supplement: string | null
}

type Options = {
  issueId: string
  name: string
  /**
   * The year, order and supplement as the editor sends them, or `null` when one
   * of them can't be read: then the stored number stays (log 0034).
   */
  number: IssueNumber | null
  /** Only the Coordinator sends the author (design 26c). */
  authorId?: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /** The last save of a page going away also ends its hold. */
  releaseHold?: boolean
}

type UpdateIssueResult =
  | {
      status: 'saved'
      updatedAt: Date
      /**
       * The saved number (`getIssuePublishedNumber`) when another issue holds
       * it as published (log 0039), `null` when it is free or incomplete.
       */
      takenNumber: string | null
      /** The year's next free order to offer for a taken main issue (26d). */
      freeOrder: number | null
    }
  /** The tab does not hold the issue; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The issue is gone: deleted meanwhile, or swept as an empty draft (0036). */
  | { status: 'deleted' }

type StoredHold = EditHoldColumns & {
  heldByAuthor: { name: string } | null
}

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Saves the issue editor's whole form, as autosave sends it (design 26c, 26d,
 * logs 0022 and 0034). The permission is checked against the stored
 * author and state; only the Coordinator sets another author. Only the tab
 * holding the edit hold saves, checked again in the save's own write (0019),
 * and the save keeps the hold unless `releaseHold` asks for the end. A draft
 * saves without its year or order. The year, order and supplement save as one,
 * as typed: a number another issue holds as published saves too, and the
 * answer says so, with a free order (log 0039). The first save ends the empty draft and is
 * its creation in the history; then one *Upraveno* per hold (07f). The caller
 * has checked the session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The issue id, the editor's tab and the edited fields.
 * @returns `saved` with the new `updatedAt` and the taken number, if any, or
 *   `not-held` with the holder's name when another tab or someone else holds
 *   the issue (nothing is written), or `deleted` when it is gone (0036).
 * @throws A 403 response for a denied edit, a locked submission or an author
 *   the editor may not set.
 */
export async function updateIssue(
  request: Request,
  { issueId, name, number, authorId, tabId, releaseHold = false }: Options,
): Promise<UpdateIssueResult> {
  const storedIssue = await prisma.issue.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      order: true,
      state: true,
      submittedAt: true,
      supplement: true,
      supplementSlug: true,
      year: true,
    },
    where: { id: issueId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036).
  if (storedIssue === null) return { status: 'deleted' }

  const { state } = storedIssue

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['issue'],
  })

  checkAuthorPermission(context, {
    action: 'update',
    entity: 'issue',
    state,
    targetAuthorIds: [storedIssue.authorId],
  })

  // A submitted issue is locked for its author (design 07d).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: storedIssue.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const tab = { authorId: context.authorId, tabId }

  // Who holds it instead of this tab (another tab of one's own included).
  const toNotHeld = (hold: StoredHold | null): UpdateIssueResult => ({
    heldByName:
      hold === null ||
      getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
        ? null
        : (hold.heldByAuthor?.name ?? null),
    status: 'not-held',
  })

  // Checked before anything is read for the save; the save's own write checks
  // it again.
  if (
    storedIssue.heldByAuthorId !== tab.authorId ||
    storedIssue.heldByTabId !== tab.tabId
  ) {
    return toNotHeld(storedIssue)
  }

  // Only the Coordinator chooses the author (design 26c, iq3nur0e).
  const savedAuthorId = authorId ?? storedIssue.authorId
  if (savedAuthorId !== storedIssue.authorId) {
    if (!canChooseRecordAuthor(context.roleLevel)) {
      throw data(null, { status: 403 })
    }
    checkAuthorPermission(context, {
      action: 'update',
      entity: 'issue',
      state,
      targetAuthorIds: [savedAuthorId],
    })
  }

  // The number sent, with its slug; one that can't be read leaves the stored
  // number as it is (log 0034).
  const savedNumber =
    number === null
      ? {
          order: storedIssue.order,
          supplement: storedIssue.supplement,
          supplementSlug: storedIssue.supplementSlug,
          year: storedIssue.year,
        }
      : {
          ...number,
          supplementSlug:
            number.supplement === null ? '' : slugify(number.supplement),
        }

  const saveInTransaction = async () => {
    const issueWrite = prisma.issue.update({
      data: {
        authorId: savedAuthorId,
        name: name === '' ? null : name,
        order: savedNumber.order,
        supplement: savedNumber.supplement,
        supplementSlug: savedNumber.supplementSlug,
        year: savedNumber.year,
        // Autosave keeps the hold; the save of a page going away ends it.
        ...(releaseHold ? RELEASED_HOLD : {}),
      },
      select: { updatedAt: true },
      // Only the holding tab saves a draft (log 0019); otherwise the
      // whole transaction rolls back.
      where: { id: issueId, state: 'draft', ...buildHeldByTabWhere(tab) },
    })

    const writes: Prisma.PrismaPromise<unknown>[] = [
      // Conditional, so of two first saves only one is the creation (0020).
      prisma.issue.updateMany({
        data: { firstContentAt: new Date() },
        where: { firstContentAt: null, id: issueId },
      }),
      issueWrite,
      // The cover's alt text follows the title (design 26c, qjv38ti4), once
      // there is one: a draft without its number keeps the stored text.
      ...(storedIssue.cover === null ||
      savedNumber.year === null ||
      savedNumber.order === null
        ? []
        : [
            // By the issue, not the row: an upload may have replaced or
            // removed the file since it was read.
            prisma.issueCover.updateMany({
              data: {
                altText: getIssueCoverAltText({
                  ...savedNumber,
                  name: name === '' ? null : name,
                }),
              },
              where: { issueId },
            }),
          ]),
    ]

    const results = await prisma.$transaction(writes)

    return {
      firstContent: results[0] as Prisma.BatchPayload,
      savedIssue: results[1] as { updatedAt: Date },
    }
  }

  let saved: Awaited<ReturnType<typeof saveInTransaction>>

  try {
    saved = await saveInTransaction()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const currentHold = await prisma.issue.findUnique({
      select: {
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
      },
      where: { id: issueId },
    })

    // Still this tab's: another row was missing (an author, say), not the
    // hold, so the save failed.
    if (
      currentHold?.heldByAuthorId === tab.authorId &&
      currentHold.heldByTabId === tab.tabId
    ) {
      throw error
    }

    // Deleted between the check and the write (0036).
    if (currentHold === null) return { status: 'deleted' }

    // The hold moved between the check and the write.
    return toNotHeld(currentHold)
  }

  // One *Upraveno* per hold, however often it saves (07f, 24e).
  await recordEditLog(context, {
    entity: 'issue',
    entityId: issueId,
    heldSince: storedIssue.heldSince,
    isCreation: saved.firstContent.count === 1,
  })

  // Saved as typed; the field says it is taken (26d, log 0039).
  const conflict = await findPublishedNumberConflict({
    issueId,
    order: savedNumber.order,
    supplementSlug: savedNumber.supplementSlug,
    year: savedNumber.year,
  })

  return {
    freeOrder: conflict?.freeOrder ?? null,
    status: 'saved',
    takenNumber: conflict?.takenNumber ?? null,
    updatedAt: saved.savedIssue.updatedAt,
  }
}

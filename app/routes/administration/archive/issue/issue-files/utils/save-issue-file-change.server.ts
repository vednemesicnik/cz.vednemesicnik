import type { Prisma } from '@generated/prisma/client'
import type { ContentLogEvent, ContentState } from '@generated/prisma/enums'
import { data } from 'react-router'

import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

/** What a file operation reads of the stored issue. */
export type FileChangeIssue = {
  year: number | null
  order: number | null
  name: string | null
  supplement: string | null
  supplementSlug: string
  state: ContentState
  cover: { id: string } | null
  pdf: { id: string; fileName: string | null } | null
}

/** One file operation, ready to commit with the hold check. */
export type PreparedFileChange = {
  writes: Prisma.PrismaPromise<unknown>[]
  /** The change adds a file: the empty draft's first content (0020). */
  addsContent?: boolean
  /** Written to the history once the change saved (26b). */
  logEvent?: Extract<ContentLogEvent, 'cover_uploaded' | 'pdf_uploaded'>
  /** Runs once the writes committed: drops files the change made obsolete. */
  onCommitted?: () => Promise<void>
  /** Runs when the writes did not commit: drops files the change stored. */
  onRefused?: () => Promise<void>
  /**
   * Runs when a cancellable change was cancelled after its writes committed,
   * before `onCommitted`: puts back what the change replaced (bxy8xxqs).
   */
  onCancelled?: () => Promise<void>
}

/**
 * The file could not be processed; nothing was stored (26d). A cover over the
 * pixel budget says so, for the field's sentence (4al3quzt).
 */
export type FileChangeFailure = {
  status: 'failed'
  reason?: 'over-pixel-budget'
}

/** How a file operation ended, as the issue editor reads it. */
export type FileChangeResult =
  | { status: 'saved'; updatedAt: Date }
  /** The tab does not hold the issue; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  | FileChangeFailure
  /** The editor cancelled the upload; nothing stays stored (bxy8xxqs). */
  | { status: 'cancelled' }

type Options = {
  issueId: string
  /** The editor's tab, which must hold the edit hold (decision 0019). */
  tabId: string
  /**
   * An upload already on its way still lands when the hold was released
   * meanwhile, never over someone else's.
   */
  landsWithoutHold?: boolean
  /**
   * An upload the editor can cancel until it saves (bxy8xxqs): the aborted
   * request is checked before the files are stored, right before the commit,
   * and once more after it, where `onCancelled` puts things back.
   */
  isCancellable?: boolean
  prepare: (
    issue: FileChangeIssue,
  ) => Promise<PreparedFileChange | FileChangeFailure>
}

type StoredHold = EditHoldColumns & {
  heldByAuthor: { name: string } | null
  state: string
  submittedAt: Date | null
}

// The hold, and what an upload landing without it checks besides.
const HOLD_SELECT = {
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  state: true,
  submittedAt: true,
} as const

/**
 * Saves one change of the issue's cover or PDF on its own (design 26c,
 * decision 0029), as the article's gallery saves an image. The permission is
 * checked against the stored author and state, and only the tab holding the
 * edit hold saves, checked again in the change's own conditional write
 * (decision 0019), which also moves the issue's `updatedAt`. The history gets
 * the creation, if this is the first content, and *PDF nahráno* or *Obálka
 * nahrána* (26b). The caller has checked the session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The issue, the editor's tab, whether the change lands
 *   without the hold or can be cancelled, and `prepare`, which checks the
 *   input, stores any files and returns the writes.
 * @returns `saved` with the new `updatedAt`, `not-held` with the holder's
 *   name (nothing is written), `failed` for a file that could not be
 *   processed, or `cancelled` for a cancellable change whose request was
 *   aborted.
 * @throws A 404 response for a missing issue, a 403 response for a denied
 *   edit or a locked submission, and whatever `prepare` throws.
 */
export async function saveIssueFileChange(
  request: Request,
  {
    issueId,
    tabId,
    landsWithoutHold = false,
    isCancellable = false,
    prepare,
  }: Options,
): Promise<FileChangeResult> {
  const isCancelled = () => isCancellable && request.signal.aborted

  const storedIssue = await prisma.issue.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      ...HOLD_SELECT,
      name: true,
      order: true,
      pdf: { select: { fileName: true, id: true } },
      supplement: true,
      supplementSlug: true,
      year: true,
    },
    where: { id: issueId },
  })

  if (storedIssue === null) {
    throw data(null, { status: 404 })
  }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'issue',
    execute: async (context): Promise<FileChangeResult> => {
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
      const toNotHeld = (hold: StoredHold | null): FileChangeResult => ({
        heldByName:
          hold === null ||
          getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
            ? null
            : (hold.heldByAuthor?.name ?? null),
        status: 'not-held',
      })

      // A submitted issue stays its author's to edit only after they take it
      // back; the approver edits it anyway (07d).
      const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
      const isHeldByTab = (hold: StoredHold | null) =>
        hold?.heldByAuthorId === tab.authorId && hold.heldByTabId === tab.tabId
      // Released while the upload was on its way: a draft nobody holds, not
      // submitted since. Leaving the draft clears the hold too (0021).
      const isFreeDraft = (hold: StoredHold | null) =>
        hold?.heldByTabId === null &&
        hold.state === 'draft' &&
        (isApprover || hold.submittedAt === null)
      const isAllowedHold = (hold: StoredHold | null) =>
        isHeldByTab(hold) || (landsWithoutHold && isFreeDraft(hold))

      // Checked before any file is stored, so a refused change stores
      // nothing; the change's own write checks it again.
      if (!isAllowedHold(storedIssue)) {
        return toNotHeld(storedIssue)
      }

      // Cancelled before any file is stored.
      if (isCancelled()) return { status: 'cancelled' }

      const prepared = await prepare(storedIssue)

      if ('status' in prepared) return prepared

      // Cancelled while the files were stored: they go, nothing commits.
      if (isCancelled()) {
        await prepared.onRefused?.()
        return { status: 'cancelled' }
      }

      const holdWhere = landsWithoutHold
        ? {
            OR: [
              buildHeldByTabWhere(tab),
              {
                heldByTabId: null,
                ...(isApprover ? {} : { submittedAt: null }),
              },
            ],
          }
        : buildHeldByTabWhere(tab)

      const issueWrite = prisma.issue.update({
        data: { updatedAt: new Date() },
        select: { updatedAt: true },
        // Only the holding tab changes a draft (decision 0019); otherwise
        // the whole transaction rolls back.
        where: { id: issueId, state: 'draft', ...holdWhere },
      })

      const firstContentWrite = prepared.addsContent
        ? [
            // Conditional, so of two first saves only one is the creation.
            prisma.issue.updateMany({
              data: { firstContentAt: new Date() },
              where: { firstContentAt: null, id: issueId },
            }),
          ]
        : []

      // The issue's `updatedAt` before this commit, read in it, for a cancel
      // to put back.
      const previousRead = isCancellable
        ? [
            prisma.issue.findUniqueOrThrow({
              select: { updatedAt: true },
              where: { id: issueId },
            }),
          ]
        : []

      let results: unknown[]

      try {
        results = await prisma.$transaction([
          ...previousRead,
          ...firstContentWrite,
          ...prepared.writes,
          issueWrite,
        ])
      } catch (error) {
        await prepared.onRefused?.()

        if (!isRecordNotFoundError(error)) throw error

        const currentHold = await prisma.issue.findUnique({
          select: HOLD_SELECT,
          where: { id: issueId },
        })

        // Still allowed: another row was missing (the file's, say), not the
        // hold, so the change failed.
        if (isAllowedHold(currentHold)) throw error

        // The hold moved between the check and the write.
        return toNotHeld(currentHold)
      }

      const isCreation =
        firstContentWrite.length > 0 &&
        (results[previousRead.length] as Prisma.BatchPayload).count === 1

      const { updatedAt } = results.at(-1) as { updatedAt: Date }

      // Cancelled during the commit: put back what it replaced. Unless
      // another change saved since, the issue is as it was: the editor's
      // `updatedAt` holds again, and the empty draft it would have filled
      // stays empty (0020).
      if (isCancelled() && prepared.onCancelled) {
        const { updatedAt: previousUpdatedAt } = results[0] as {
          updatedAt: Date
        }
        try {
          await prepared.onCancelled()
          await prisma.issue.updateMany({
            data: {
              updatedAt: previousUpdatedAt,
              ...(isCreation ? { firstContentAt: null } : {}),
            },
            where: { id: issueId, updatedAt },
          })
        } catch (error) {
          console.error('Issue file change left after a cancel', error)
        }
        return { status: 'cancelled' }
      }

      // The change is saved; files it left behind are only litter.
      try {
        await prepared.onCommitted?.()
      } catch (error) {
        console.error('Issue files left after a saved change', error)
      }

      // An empty draft's history starts with its first content (0020); the
      // upload itself is the edit (26b).
      if (isCreation) {
        await recordEditLog(context, {
          entity: 'issue',
          entityId: issueId,
          heldSince: storedIssue.heldSince,
          isCreation,
        })
      }
      if (prepared.logEvent !== undefined) {
        await recordContentLog(
          { entity: 'issue', entityId: issueId, events: [prepared.logEvent] },
          context,
        )
        if (!isCreation) {
          publishContentEvent(
            { change: 'update', entity: 'issue', entityId: issueId },
            context,
          )
        }
      }

      return { status: 'saved', updatedAt }
    },
    target: {
      authorIds: [storedIssue.authorId],
      state: storedIssue.state,
    },
  })
}

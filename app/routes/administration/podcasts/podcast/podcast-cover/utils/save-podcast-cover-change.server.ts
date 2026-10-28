import type { Prisma } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
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

/** What a cover change reads of the stored podcast. */
export type CoverChangePodcast = {
  title: string
  state: ContentState
  cover: { id: string } | null
}

/** One cover change, ready to commit with the hold check. */
export type PreparedCoverChange = {
  writes: Prisma.PrismaPromise<unknown>[]
  /** The change adds a cover: the empty draft's first content (0020). */
  addsContent?: boolean
  /** An upload is *Obálka nahrána* in the history (26b); else an edit. */
  isUpload?: boolean
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
 * The image could not be processed; nothing was stored. One over the pixel
 * budget says so, for the field's sentence (4al3quzt).
 */
export type CoverChangeFailure = {
  status: 'failed'
  reason?: 'over-pixel-budget'
}

/** How a cover change ended, as the podcast editor reads it. */
export type CoverChangeResult =
  | { status: 'saved'; updatedAt: Date }
  /** The tab does not hold the podcast; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The podcast is gone: deleted meanwhile (0036). */
  | { status: 'deleted' }
  | CoverChangeFailure
  /** The editor cancelled the upload; nothing stays stored (bxy8xxqs). */
  | { status: 'cancelled' }

type Options = {
  podcastId: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
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
    podcast: CoverChangePodcast,
  ) => Promise<PreparedCoverChange | CoverChangeFailure>
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
 * Saves one change of the podcast's cover on its own (design 27e), as the
 * episode's own cover saves (27d; log 0029). The permission is checked
 * against the stored author and state, and only the tab holding the edit hold
 * saves, checked again in the change's own conditional write (log 0019), which
 * also moves the podcast's `updatedAt`. The history gets the creation, if this
 * is the first content, then *Obálka nahrána* for an upload (26b) or the one
 * *Upraveno* per hold for a removal (07f). The caller has checked the session
 * (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The podcast, the editor's tab, whether the change lands
 *   without the hold or can be cancelled, and `prepare`, which checks the
 *   input, stores any files and returns the writes.
 * @returns `saved` with the new `updatedAt`, `not-held` with the holder's
 *   name (nothing is written), `deleted` when the podcast is gone, `failed`
 *   for an image that could not be processed, or `cancelled` for a
 *   cancellable change whose request was aborted.
 * @throws A 403 response for a denied edit or a locked submission, and
 *   whatever `prepare` throws.
 */
export async function savePodcastCoverChange(
  request: Request,
  {
    podcastId,
    tabId,
    landsWithoutHold = false,
    isCancellable = false,
    prepare,
  }: Options,
): Promise<CoverChangeResult> {
  const isCancelled = () => isCancellable && request.signal.aborted

  const storedPodcast = await prisma.podcast.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      ...HOLD_SELECT,
      title: true,
    },
    where: { id: podcastId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036).
  if (storedPodcast === null) return { status: 'deleted' }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'podcast',
    execute: async (context): Promise<CoverChangeResult> => {
      // A submitted podcast is locked for its author (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedPodcast.submittedAt,
        })
      ) {
        throw data(null, { status: 403 })
      }

      const tab = { authorId: context.authorId, tabId }

      // Who holds it instead of this tab (another tab of one's own included).
      const toNotHeld = (hold: StoredHold | null): CoverChangeResult => ({
        heldByName:
          hold === null ||
          getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
            ? null
            : (hold.heldByAuthor?.name ?? null),
        status: 'not-held',
      })

      // A submitted podcast stays its author's to edit only after they take
      // it back; the approver edits it anyway (07d).
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
      if (!isAllowedHold(storedPodcast)) {
        return toNotHeld(storedPodcast)
      }

      // Cancelled before any file is stored.
      if (isCancelled()) return { status: 'cancelled' }

      const prepared = await prepare({
        cover: storedPodcast.cover,
        state: storedPodcast.state,
        title: storedPodcast.title,
      })

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

      const podcastWrite = prisma.podcast.update({
        data: { updatedAt: new Date() },
        select: { updatedAt: true },
        // Only the holding tab changes a draft (log 0019); otherwise the
        // whole transaction rolls back.
        where: { id: podcastId, state: 'draft', ...holdWhere },
      })

      const firstContentWrite = prepared.addsContent
        ? [
            // Conditional, so of two first saves only one is the creation.
            prisma.podcast.updateMany({
              data: { firstContentAt: new Date() },
              where: { firstContentAt: null, id: podcastId },
            }),
          ]
        : []

      // The podcast's `updatedAt` before this commit, read in it, for a cancel
      // to put back.
      const previousRead = isCancellable
        ? [
            prisma.podcast.findUniqueOrThrow({
              select: { updatedAt: true },
              where: { id: podcastId },
            }),
          ]
        : []

      let results: unknown[]

      try {
        results = await prisma.$transaction([
          ...previousRead,
          ...firstContentWrite,
          ...prepared.writes,
          podcastWrite,
        ])
      } catch (error) {
        await prepared.onRefused?.()

        const currentHold = await prisma.podcast.findUnique({
          select: HOLD_SELECT,
          where: { id: podcastId },
        })

        // Deleted between the check and the write (0036): a new cover's row
        // fails on its foreign key, the rest on the missing podcast.
        if (currentHold === null) return { status: 'deleted' }

        if (!isRecordNotFoundError(error)) throw error

        // Still allowed: another row was missing (the cover's, say), not the
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
      // another change saved since, the podcast is as it was: the editor's
      // `updatedAt` holds again, and the empty draft it would have filled
      // stays empty (0020).
      if (isCancelled() && prepared.onCancelled) {
        const { updatedAt: previousUpdatedAt } = results[0] as {
          updatedAt: Date
        }
        try {
          await prepared.onCancelled()
        } catch (error) {
          console.error('Podcast cover change left after a cancel', error)
        }
        // On its own: files left behind must not keep the draft filled.
        try {
          await prisma.podcast.updateMany({
            data: {
              updatedAt: previousUpdatedAt,
              ...(isCreation ? { firstContentAt: null } : {}),
            },
            where: { id: podcastId, updatedAt },
          })
        } catch (error) {
          console.error('Podcast left changed after a cancel', error)
        }
        return { status: 'cancelled' }
      }

      // The change is saved; files it left behind are only litter.
      try {
        await prepared.onCommitted?.()
      } catch (error) {
        console.error('Podcast cover files left after a saved change', error)
      }

      // An empty draft's history starts with its first content (0020); an
      // upload itself is the edit (26b), a removal one *Upraveno* per hold.
      // The edit's log tells the open lists too.
      const isEdit =
        isCreation || (!prepared.isUpload && prepared.writes.length > 0)
      if (isEdit) {
        await recordEditLog(context, {
          entity: 'podcast',
          entityId: podcastId,
          heldSince: storedPodcast.heldSince,
          isCreation,
        })
      }
      if (prepared.isUpload) {
        await recordContentLog(
          {
            entity: 'podcast',
            entityId: podcastId,
            events: ['cover_uploaded'],
          },
          context,
        )
      }
      // The open lists hear of an upload.
      if (!isEdit && prepared.writes.length > 0) {
        publishContentEvent(
          { change: 'update', entity: 'podcast', entityId: podcastId },
          context,
        )
      }

      return { status: 'saved', updatedAt }
    },
    target: {
      authorIds: [storedPodcast.authorId],
      state: storedPodcast.state,
    },
  })
}

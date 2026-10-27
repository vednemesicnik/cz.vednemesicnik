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

/** What a cover change reads of the stored episode. */
export type CoverChangeEpisode = {
  number: number | null
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
}

/**
 * The image could not be processed; nothing was stored. One over the pixel
 * budget says so, for the field's sentence (4al3quzt).
 */
export type CoverChangeFailure = {
  status: 'failed'
  reason?: 'over-pixel-budget'
}

/** How a cover change ended, as the episode editor reads it. */
export type CoverChangeResult =
  | { status: 'saved'; updatedAt: Date }
  /** The tab does not hold the episode; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The episode is gone: deleted meanwhile (0036). */
  | { status: 'deleted' }
  | CoverChangeFailure

type Options = {
  podcastId: string
  episodeId: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /**
   * An upload already on its way still lands when the hold was released
   * meanwhile, never over someone else's.
   */
  landsWithoutHold?: boolean
  prepare: (
    episode: CoverChangeEpisode,
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
 * Saves one change of the episode's own cover on its own (design 27d), as the
 * issue editor saves its cover (log 0029). The permission is checked against
 * the stored author and state, and only the tab holding the edit hold saves,
 * checked again in the change's own conditional write (log 0019), which also
 * moves the episode's `updatedAt`. The history gets the creation, if this is
 * the first content, then *Obálka nahrána* for an upload (26b) or the one
 * *Upraveno* per hold for a removal (07f). The caller has checked the session
 * (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The podcast and the episode, the editor's tab, whether the
 *   change lands without the hold, and `prepare`, which checks the input,
 *   stores any files and returns the writes.
 * @returns `saved` with the new `updatedAt`, `not-held` with the holder's
 *   name (nothing is written), `deleted` when the episode is gone, or
 *   `failed` for an image that could not be processed.
 * @throws A 403 response for a denied edit or a locked submission, and
 *   whatever `prepare` throws.
 */
export async function saveEpisodeCoverChange(
  request: Request,
  { podcastId, episodeId, tabId, landsWithoutHold = false, prepare }: Options,
): Promise<CoverChangeResult> {
  const storedEpisode = await prisma.podcastEpisode.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      ...HOLD_SELECT,
      number: true,
      podcastId: true,
      title: true,
    },
    where: { id: episodeId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036);
  // the address names the podcast, so another one's episode is not here.
  if (storedEpisode === null || storedEpisode.podcastId !== podcastId) {
    return { status: 'deleted' }
  }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'podcast_episode',
    execute: async (context): Promise<CoverChangeResult> => {
      // A submitted episode is locked for its author (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedEpisode.submittedAt,
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

      // A submitted episode stays its author's to edit only after they take
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
      if (!isAllowedHold(storedEpisode)) {
        return toNotHeld(storedEpisode)
      }

      const prepared = await prepare({
        cover: storedEpisode.cover,
        number: storedEpisode.number,
        state: storedEpisode.state,
        title: storedEpisode.title,
      })

      if ('status' in prepared) return prepared

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

      const episodeWrite = prisma.podcastEpisode.update({
        data: { updatedAt: new Date() },
        select: { updatedAt: true },
        // Only the holding tab changes a draft (log 0019); otherwise the
        // whole transaction rolls back.
        where: { id: episodeId, state: 'draft', ...holdWhere },
      })

      const firstContentWrite = prepared.addsContent
        ? [
            // Conditional, so of two first saves only one is the creation.
            prisma.podcastEpisode.updateMany({
              data: { firstContentAt: new Date() },
              where: { firstContentAt: null, id: episodeId },
            }),
          ]
        : []

      let results: unknown[]

      try {
        results = await prisma.$transaction([
          ...firstContentWrite,
          ...prepared.writes,
          episodeWrite,
        ])
      } catch (error) {
        await prepared.onRefused?.()

        const currentHold = await prisma.podcastEpisode.findUnique({
          select: HOLD_SELECT,
          where: { id: episodeId },
        })

        // Deleted between the check and the write (0036): a new cover's row
        // fails on its foreign key, the rest on the missing episode.
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
        (results[0] as Prisma.BatchPayload).count === 1

      const { updatedAt } = results.at(-1) as { updatedAt: Date }

      // The change is saved; files it left behind are only litter.
      try {
        await prepared.onCommitted?.()
      } catch (error) {
        console.error('Episode cover files left after a saved change', error)
      }

      // An empty draft's history starts with its first content (0020); an
      // upload itself is the edit (26b), a removal one *Upraveno* per hold.
      // The edit's log tells the open lists too.
      const isEdit =
        isCreation || (!prepared.isUpload && prepared.writes.length > 0)
      if (isEdit) {
        await recordEditLog(context, {
          entity: 'podcast_episode',
          entityId: episodeId,
          heldSince: storedEpisode.heldSince,
          isCreation,
        })
      }
      if (prepared.isUpload) {
        await recordContentLog(
          {
            entity: 'podcast_episode',
            entityId: episodeId,
            events: ['cover_uploaded'],
          },
          context,
        )
      }
      // The open lists hear of an upload.
      if (!isEdit && prepared.writes.length > 0) {
        publishContentEvent(
          { change: 'update', entity: 'podcast_episode', entityId: episodeId },
          context,
        )
      }

      return { status: 'saved', updatedAt }
    },
    target: {
      authorIds: [storedEpisode.authorId],
      state: storedEpisode.state,
    },
  })
}

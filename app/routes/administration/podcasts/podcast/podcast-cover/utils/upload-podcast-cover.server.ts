import type { Prisma } from '@generated/prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { PODCAST_COVER_CONFIG } from '~/config/podcast-cover-config'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import {
  deleteImage,
  deleteImageVersion,
  type StoredImageMeta,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { getPodcastCoverAltText } from '~/utils/podcast/get-podcast-cover-alt-text'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  podcastId: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  file: File
}

/** How an upload ended, as the podcast editor reads it. */
export type PodcastCoverUploadResult =
  | { status: 'saved'; updatedAt: Date }
  /** The tab does not hold the podcast; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The podcast is gone: deleted meanwhile (0036). */
  | { status: 'deleted' }
  /**
   * The image could not be processed; nothing was stored. One over the pixel
   * budget says so, for the field's sentence (4al3quzt).
   */
  | { status: 'failed'; reason?: 'over-pixel-budget' }

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
 * Stores the podcast's cover as soon as it is picked (design 27e, as the
 * issue's in 26c and the episode's in 27d; log 0029). A first cover gets its
 * row once its variants are stored and ends the empty draft (0020); a
 * replacement keeps the cover's id and gets a new version, whose predecessor
 * goes only after the row commits, so a failed replacement keeps the old
 * cover. The alt text is composed from the title. Only the tab holding the
 * edit hold saves, checked again in the change's own conditional write (log
 * 0019); an upload on its way still lands after *Zavřít* released the hold,
 * never over someone else's. The history gets the creation, if this is the
 * first content, then *Obálka nahrána* (26b). Cancelling an upload is #712.
 * The caller has checked the session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The podcast, the editor's tab and the file.
 * @returns `saved` with the new `updatedAt`, `not-held` with the holder's
 *   name (nothing is stored), `deleted` when the podcast is gone, or `failed`
 *   for an image that could not be processed, with `over-pixel-budget` for one
 *   over `MAX_IMAGE_PIXELS`, refused before it is stored (4al3quzt).
 * @throws A 400 response for a file that is not an image or is too big, and a
 *   403 one for a denied edit or a locked submission.
 */
export async function uploadPodcastCover(
  request: Request,
  { podcastId, tabId, file }: Options,
): Promise<PodcastCoverUploadResult> {
  if (
    file.size === 0 ||
    file.size > PODCAST_COVER_CONFIG.maxFileBytes ||
    !file.type.startsWith('image/')
  ) {
    throw data(null, { status: 400 })
  }

  const storedPodcast = await prisma.podcast.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true, version: true } },
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
    execute: async (context): Promise<PodcastCoverUploadResult> => {
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
      const toNotHeld = (
        hold: StoredHold | null,
      ): PodcastCoverUploadResult => ({
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
      // Released while the upload was on its way: a draft nobody holds, not
      // submitted since. Leaving the draft clears the hold too (0021).
      const isAllowedHold = (hold: StoredHold | null) =>
        (hold?.heldByAuthorId === tab.authorId &&
          hold.heldByTabId === tab.tabId) ||
        (hold?.heldByTabId === null &&
          hold.state === 'draft' &&
          (isApprover || hold.submittedAt === null))

      // Checked before any file is stored, so a refused upload stores
      // nothing; the upload's own write checks it again.
      if (!isAllowedHold(storedPodcast)) return toNotHeld(storedPodcast)

      if (await isImageOverPixelBudget(file)) {
        return { reason: 'over-pixel-budget', status: 'failed' }
      }

      const storedCover = storedPodcast.cover
      const coverId = storedCover?.id ?? createId()

      let meta: StoredImageMeta
      try {
        meta = await storeImageVariants(coverId, file)
      } catch {
        // What made it to the store goes; a replaced cover keeps its version.
        if (storedCover === null) await deleteImage(coverId).catch(() => {})
        return { status: 'failed' }
      }

      const isNewVersion =
        storedCover !== null && storedCover.version !== meta.version
      // Drops what this upload stored when its row did not commit.
      const dropStored = async () => {
        if (storedCover === null) await deleteImage(coverId)
        else if (isNewVersion) await deleteImageVersion(coverId, meta.version)
      }

      const coverWrite =
        storedCover === null
          ? prisma.podcastCover.create({
              data: {
                ...meta,
                altText: getPodcastCoverAltText(storedPodcast.title),
                id: coverId,
                podcastId,
              },
              select: { id: true },
            })
          : prisma.podcastCover.update({
              data: meta,
              select: { id: true },
              where: { id: coverId },
            })

      // A first cover is content: conditional, so of two first saves only
      // one is the creation (0020).
      const firstContentWrites: Prisma.PrismaPromise<Prisma.BatchPayload>[] =
        storedCover === null
          ? [
              prisma.podcast.updateMany({
                data: { firstContentAt: new Date() },
                where: { firstContentAt: null, id: podcastId },
              }),
            ]
          : []

      const podcastWrite = prisma.podcast.update({
        data: { updatedAt: new Date() },
        select: { updatedAt: true },
        // Only the holding tab, or a free draft after its release, changes a
        // draft (log 0019); otherwise the whole transaction rolls back.
        where: {
          id: podcastId,
          OR: [
            buildHeldByTabWhere(tab),
            {
              heldByTabId: null,
              ...(isApprover ? {} : { submittedAt: null }),
            },
          ],
          state: 'draft',
        },
      })

      let results: unknown[]

      try {
        results = await prisma.$transaction([
          ...firstContentWrites,
          coverWrite,
          podcastWrite,
        ])
      } catch (error) {
        await dropStored().catch(() => {})

        const currentHold = await prisma.podcast.findUnique({
          select: HOLD_SELECT,
          where: { id: podcastId },
        })

        // Deleted between the check and the write (0036): a new cover's row
        // fails on its foreign key, the rest on the missing podcast.
        if (currentHold === null) return { status: 'deleted' }

        if (!isRecordNotFoundError(error)) throw error

        // Still allowed: another row was missing (the cover's, say), not the
        // hold, so the upload failed.
        if (isAllowedHold(currentHold)) throw error

        // The hold moved between the check and the write.
        return toNotHeld(currentHold)
      }

      const isCreation =
        firstContentWrites.length > 0 &&
        (results[0] as Prisma.BatchPayload).count === 1
      const { updatedAt } = results.at(-1) as { updatedAt: Date }

      // The upload is saved; the replaced version is only litter.
      if (isNewVersion) {
        await deleteImageVersion(coverId, storedCover.version).catch(
          (error: unknown) => {
            console.error('Podcast cover files left after an upload', error)
          },
        )
      }

      // An empty draft's history starts with its first content (0020), and
      // its log tells the open lists; the upload itself is *Obálka nahrána*
      // (26b).
      if (isCreation) {
        await recordEditLog(context, {
          entity: 'podcast',
          entityId: podcastId,
          heldSince: storedPodcast.heldSince,
          isCreation,
        })
      }
      await recordContentLog(
        { entity: 'podcast', entityId: podcastId, events: ['cover_uploaded'] },
        context,
      )
      // The open lists hear of a replaced cover too.
      if (!isCreation) {
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

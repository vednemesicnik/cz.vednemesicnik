import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { canChooseRecordAuthor } from '~/routes/administration/articles/utils/can-choose-record-author'
import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { getPodcastCoverAltText } from '~/utils/podcast/get-podcast-cover-alt-text'

import { findPublishedPodcastConflict } from '../../../utils/find-published-podcast-conflict.server'

type Options = {
  podcastId: string
  title: string
  description: string
  slug: string
  /** Only the Coordinator sends the author (design 27e, as 25c). */
  authorId?: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /** The last save of a page going away also ends its hold. */
  releaseHold?: boolean
}

type UpdatePodcastResult =
  | {
      status: 'saved'
      updatedAt: Date
      /** The saved address when another podcast holds it as published (27e). */
      takenSlug: string | null
      slugSuggestion: string | null
    }
  /** The tab does not hold the podcast; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The podcast is gone: deleted meanwhile, or swept as an empty draft (0036). */
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
 * Saves the podcast editor's whole form, as autosave sends it (design 27e,
 * logs 0022 and 0039). The permission is checked against the stored author
 * and state; only the Coordinator sets another author. Only the tab holding
 * the edit hold saves, checked again in the save's own write (0019), and the
 * save keeps the hold unless `releaseHold` asks for the end. A draft saves
 * incomplete, and an empty address stays empty: 27i asks for it at submit.
 * An address another podcast holds as published saves too, and the answer
 * says so, with a free one (27e). The first save with a title or description
 * ends the empty draft and is its creation in the history; then one
 * *Upraveno* per hold (07f). The caller has checked the session
 * (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The podcast id, the editor's tab and the edited fields.
 * @returns `saved` with the new `updatedAt` and the taken address, if any, or
 *   `not-held` with the holder's name when another tab or someone else holds
 *   the podcast (nothing is written), or `deleted` when it is gone (0036).
 * @throws A 403 response for a denied edit, a locked submission or an author
 *   the editor may not set.
 */
export async function updatePodcast(
  request: Request,
  {
    podcastId,
    title,
    description,
    slug,
    authorId,
    tabId,
    releaseHold = false,
  }: Options,
): Promise<UpdatePodcastResult> {
  const storedPodcast = await prisma.podcast.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      state: true,
      submittedAt: true,
    },
    where: { id: podcastId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036).
  if (storedPodcast === null) return { status: 'deleted' }

  const { state } = storedPodcast

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast'],
  })

  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    state,
    targetAuthorIds: [storedPodcast.authorId],
  })

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
  const toNotHeld = (hold: StoredHold | null): UpdatePodcastResult => ({
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
    storedPodcast.heldByAuthorId !== tab.authorId ||
    storedPodcast.heldByTabId !== tab.tabId
  ) {
    return toNotHeld(storedPodcast)
  }

  // Only the Coordinator chooses the author (design 27e, as 25c).
  const savedAuthorId = authorId ?? storedPodcast.authorId
  if (savedAuthorId !== storedPodcast.authorId) {
    if (!canChooseRecordAuthor(context.roleLevel)) {
      throw data(null, { status: 403 })
    }
    checkAuthorPermission(context, {
      action: 'update',
      entity: 'podcast',
      state,
      targetAuthorIds: [savedAuthorId],
    })
  }

  // The address alone is no content, as the episode's number (log 0048).
  const hasContent = title !== '' || description !== ''

  const saveInTransaction = async () => {
    // Conditional, so of two first saves only one is the creation (0020).
    const firstContentWrites = hasContent
      ? [
          prisma.podcast.updateMany({
            data: { firstContentAt: new Date() },
            where: { firstContentAt: null, id: podcastId },
          }),
        ]
      : []

    const writes: Prisma.PrismaPromise<unknown>[] = [
      ...firstContentWrites,
      prisma.podcast.update({
        data: {
          authorId: savedAuthorId,
          description,
          slug,
          title,
          // Autosave keeps the hold; the save of a page going away ends it.
          ...(releaseHold ? RELEASED_HOLD : {}),
        },
        select: { updatedAt: true },
        // Only the holding tab saves a draft (log 0019); otherwise the
        // whole transaction rolls back.
        where: { id: podcastId, state: 'draft', ...buildHeldByTabWhere(tab) },
      }),
      // The cover's alt text follows the title. By the podcast, not the row:
      // an upload may have replaced it.
      ...(storedPodcast.cover === null
        ? []
        : [
            prisma.podcastCover.updateMany({
              data: { altText: getPodcastCoverAltText(title) },
              where: { podcastId },
            }),
          ]),
    ]

    const results = await prisma.$transaction(writes)

    return {
      isCreation: hasContent && (results[0] as Prisma.BatchPayload).count === 1,
      savedPodcast: results[firstContentWrites.length] as { updatedAt: Date },
    }
  }

  let saved: Awaited<ReturnType<typeof saveInTransaction>>

  try {
    saved = await saveInTransaction()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const currentHold = await prisma.podcast.findUnique({
      select: {
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
      },
      where: { id: podcastId },
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

  // Still empty, it has no history yet (log 0020).
  if (storedPodcast.firstContentAt !== null || saved.isCreation) {
    // One *Upraveno* per hold, however often it saves (07f, 24e).
    await recordEditLog(context, {
      entity: 'podcast',
      entityId: podcastId,
      heldSince: storedPodcast.heldSince,
      isCreation: saved.isCreation,
    })
  }

  // Saved as typed; the field says it is taken (27e).
  const conflict = await findPublishedPodcastConflict({ podcastId, slug })

  return {
    ...conflict,
    status: 'saved',
    updatedAt: saved.savedPodcast.updatedAt,
  }
}

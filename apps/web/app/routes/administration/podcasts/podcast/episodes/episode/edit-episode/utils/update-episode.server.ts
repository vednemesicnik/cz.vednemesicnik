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
import { getEpisodeCoverAltText } from '~/utils/podcast-episode/get-episode-cover-alt-text'
import { slugify } from '~/utils/slugify'

import { findPublishedEpisodeConflict } from '../../../utils/find-published-episode-conflict.server'

type EpisodeLink = {
  label: string
  url: string
}

type Options = {
  episodeId: string
  title: string
  description: string
  /**
   * The number as the editor sends it, `null` when cleared, or `undefined`
   * when it can't be read: then the stored number stays (log 0034).
   */
  number: number | null | undefined
  slug: string
  links: EpisodeLink[]
  /** Only the Coordinator sends the author (design 27d, as 25c). */
  authorId?: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /** The last save of a page going away also ends its hold. */
  releaseHold?: boolean
}

type UpdateEpisodeResult =
  | {
      status: 'saved'
      updatedAt: Date
      /** The saved number when another episode holds it as published (27f). */
      takenNumber: number | null
      freeNumber: number | null
      /** The saved address when another episode holds it as published (27f). */
      takenSlug: string | null
      slugSuggestion: string | null
    }
  /** The tab does not hold the episode; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The episode is gone: deleted meanwhile, or swept as an empty draft (0036). */
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
 * Saves the episode editor's whole form, as autosave sends it (design 27d,
 * logs 0022 and 0048). The permission is checked against the stored author
 * and state; only the Coordinator sets another author. Only the tab holding
 * the edit hold saves, checked again in the save's own write (0019), and the
 * save keeps the hold unless `releaseHold` asks for the end. A draft saves
 * incomplete: a link saves as typed, without its label or with an invalid
 * address, and only a fully empty row is dropped (27d, 2o0uwhgp). The links
 * replace the stored ones as a set, in the order sent. A title gives an
 * address when the editor sends none (24a). A number or address another
 * episode holds as published saves too, and the answer says so, with a free
 * one (27f). The first save with a title, description or link ends the empty
 * draft and is its creation in the history; then one *Upraveno* per hold
 * (07f). The caller has checked the session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The episode id, the editor's tab and the edited fields.
 * @returns `saved` with the new `updatedAt` and the taken values, if any, or
 *   `not-held` with the holder's name when another tab or someone else holds
 *   the episode (nothing is written), or `deleted` when it is gone (0036).
 * @throws A 403 response for a denied edit, a locked submission or an author
 *   the editor may not set.
 */
export async function updateEpisode(
  request: Request,
  {
    episodeId,
    title,
    description,
    number,
    slug,
    links,
    authorId,
    tabId,
    releaseHold = false,
  }: Options,
): Promise<UpdateEpisodeResult> {
  const storedEpisode = await prisma.podcastEpisode.findUnique({
    select: {
      authorId: true,
      cover: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      number: true,
      podcastId: true,
      state: true,
      submittedAt: true,
    },
    where: { id: episodeId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036).
  if (storedEpisode === null) return { status: 'deleted' }

  const { state } = storedEpisode

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast_episode'],
  })

  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode',
    state,
    targetAuthorIds: [storedEpisode.authorId],
  })

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
  const toNotHeld = (hold: StoredHold | null): UpdateEpisodeResult => ({
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
    storedEpisode.heldByAuthorId !== tab.authorId ||
    storedEpisode.heldByTabId !== tab.tabId
  ) {
    return toNotHeld(storedEpisode)
  }

  // Only the Coordinator chooses the author (design 27d, as 25c).
  const savedAuthorId = authorId ?? storedEpisode.authorId
  if (savedAuthorId !== storedEpisode.authorId) {
    if (!canChooseRecordAuthor(context.roleLevel)) {
      throw data(null, { status: 403 })
    }
    checkAuthorPermission(context, {
      action: 'update',
      entity: 'podcast_episode',
      state,
      targetAuthorIds: [savedAuthorId],
    })
  }

  // A number that can't be read leaves the stored one as it is (log 0034).
  const savedNumber = number === undefined ? storedEpisode.number : number
  // With a title an episode always has an address: 27h never asks for one.
  const savedSlug = slug === '' ? slugify(title) : slug
  // Only a fully empty row is no link (27d).
  const savedLinks = links.filter(
    (link) => link.label !== '' || link.url !== '',
  )
  const hasContent = title !== '' || description !== '' || savedLinks.length > 0

  const saveInTransaction = async () => {
    // Conditional, so of two first saves only one is the creation (0020).
    const firstContentWrites = hasContent
      ? [
          prisma.podcastEpisode.updateMany({
            data: { firstContentAt: new Date() },
            where: { firstContentAt: null, id: episodeId },
          }),
        ]
      : []

    const writes: Prisma.PrismaPromise<unknown>[] = [
      ...firstContentWrites,
      prisma.podcastEpisode.update({
        data: {
          authorId: savedAuthorId,
          description,
          number: savedNumber,
          slug: savedSlug,
          title,
          // Autosave keeps the hold; the save of a page going away ends it.
          ...(releaseHold ? RELEASED_HOLD : {}),
        },
        select: { updatedAt: true },
        // Only the holding tab saves a draft (log 0019); otherwise the
        // whole transaction rolls back.
        where: { id: episodeId, state: 'draft', ...buildHeldByTabWhere(tab) },
      }),
      // The links replace the stored set, in the editor's order.
      prisma.podcastEpisodeLink.deleteMany({ where: { episodeId } }),
      prisma.podcastEpisodeLink.createMany({
        data: savedLinks.map((link, index) => ({
          episodeId,
          label: link.label,
          order: index,
          url: link.url,
        })),
      }),
      // The own cover's alt text follows the title (27d, as 26c). By the
      // episode, not the row: an upload may have replaced or removed it.
      ...(storedEpisode.cover === null
        ? []
        : [
            prisma.podcastEpisodeCover.updateMany({
              data: {
                altText: getEpisodeCoverAltText({ number: savedNumber, title }),
              },
              where: { episodeId },
            }),
          ]),
    ]

    const results = await prisma.$transaction(writes)

    return {
      isCreation: hasContent && (results[0] as Prisma.BatchPayload).count === 1,
      savedEpisode: results[firstContentWrites.length] as { updatedAt: Date },
    }
  }

  let saved: Awaited<ReturnType<typeof saveInTransaction>>

  try {
    saved = await saveInTransaction()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const currentHold = await prisma.podcastEpisode.findUnique({
      select: {
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
      },
      where: { id: episodeId },
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
  if (storedEpisode.firstContentAt !== null || saved.isCreation) {
    // One *Upraveno* per hold, however often it saves (07f, 24e).
    await recordEditLog(context, {
      entity: 'podcast_episode',
      entityId: episodeId,
      heldSince: storedEpisode.heldSince,
      isCreation: saved.isCreation,
    })
  }

  // Saved as typed; the field says it is taken (27f).
  const conflict = await findPublishedEpisodeConflict({
    episodeId,
    number: savedNumber,
    podcastId: storedEpisode.podcastId,
    slug: savedSlug,
  })

  return {
    ...conflict,
    status: 'saved',
    updatedAt: saved.savedEpisode.updatedAt,
  }
}

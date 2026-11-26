import { getBulkActions } from '~/utils/bulk-action/get-bulk-actions'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'

import { formatEditHoldLine } from '../../articles/utils/format-edit-hold-line'
import { getArticleHold } from '../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../articles/utils/get-held-action-flags'
import { getMissingPodcastContent } from './get-missing-podcast-content'
import { getPodcastActions } from './get-podcast-actions'
import { getPodcastFactLine } from './get-podcast-fact-line'
import type { PodcastRowRecord } from './podcast-row-select'

type Options = {
  context: Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>
  now: Date
  isSlugTaken: boolean
  publishedEpisodeCount: number
}

/**
 * A podcast row, wherever the row stands (design 27a, 27f, 27i, 07c): what the
 * role may do, held back while someone else edits it, every action in „⋯“ —
 * the row has no main action.
 *
 * @param podcast - The row's columns (`PODCAST_ROW_SELECT`).
 * @param options.context - The author permission context, loaded with the
 *   actions view, update, delete, publish, retract, archive, restore and
 *   review on `podcast`.
 * @param options.now - The moment of the load, which decides whether a hold
 *   has expired.
 * @param options.isSlugTaken - Another podcast holds its address as published
 *   (log 0039).
 * @param options.publishedEpisodeCount - Its episodes on the web, which its
 *   retract and archive dialogs count.
 * @returns The row's actions, the bulk actions it joins, its tag state and
 *   fact, who holds it, and what its dialogs count.
 */
export const getPodcastRow = (
  podcast: PodcastRowRecord,
  { context, now, isSlugTaken, publishedEpisodeCount }: Options,
) => {
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(podcast, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn
  const unheldFlags = getContentActionFlags(context, 'podcast', {
    authors: [podcast.author],
    reviews: podcast.reviews,
    state: podcast.state,
    submittedAt: podcast.submittedAt,
  })
  // While someone else edits it, its edit and state actions wait; the
  // Coordinator's Upravit opens the takeover (27a, as 26i).
  const flags = getHeldActionFlags(unheldFlags, { isApprover, isHeldByOther })
  const submission = flags.submission?.state ?? null

  const actions = getPodcastActions({
    ...flags,
    canEdit: flags.canEdit || flags.canTakeOver,
    state: podcast.state,
    submission,
  })
  const unheldActions = getPodcastActions({
    ...unheldFlags,
    state: podcast.state,
    submission,
  })

  return {
    actions,
    // What the selection bar may apply to this row (22c, 27a); a podcast
    // with episodes is never deleted (27f), and a held one is skipped and
    // said apart, not left out of the bar's actions.
    bulkActions: getBulkActions({
      isApprover,
      menu: unheldActions.filter(
        (action) => action !== 'delete' || podcast._count.episodes === 0,
      ),
      row: null,
    }),
    cover:
      podcast.cover === null
        ? null
        : createImageSources('podcast-cover', podcast.cover),
    episodeCount: podcast._count.episodes,
    // The row's tag says what the detail's does (07a), with one fact (27a).
    factLine: getPodcastFactLine({
      authorName: podcast.author.name,
      state: podcast.state,
      submission: flags.submission,
      submittedByName: podcast.submittedBy?.name ?? null,
      updatedAt: podcast.updatedAt,
    }),
    heldUntil: hold?.heldUntil.toISOString() ?? null,
    // Who edits it, ahead of the fact (27a, as 26i); the list looks again
    // when it should expire.
    holdLine:
      hold === null
        ? null
        : formatEditHoldLine({
            holderName: hold.heldByName,
            isOwn: hold.isOwn,
            now,
          }),
    id: podcast.id,
    isHeldByOther,
    // Bulk publishing skips it and says so up front (27i, 27a).
    isIncomplete:
      isApprover &&
      getMissingPodcastContent({
        description: podcast.description,
        hasCover: podcast.cover !== null,
        isSlugTaken,
        slug: podcast.slug,
        title: podcast.title,
      }).length > 0,
    // Publishing it, the dialog says it isn't submitted (27a, as 22c).
    isNotSubmitted:
      podcast.state === 'draft' &&
      flags.submission === null &&
      flags.isSubmittable &&
      !flags.isOwnContent,
    publishedEpisodeCount,
    slug: podcast.slug,
    state: podcast.state,
    submission,
    // A draft saved without a title goes by a name (copy utgh1hb7).
    title: getPodcastDisplayTitle(podcast.title),
  }
}

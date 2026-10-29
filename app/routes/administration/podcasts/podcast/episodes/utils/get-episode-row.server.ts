import { getBulkActions } from '~/utils/bulk-action/get-bulk-actions'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { formatEditHoldLine } from '../../../../articles/utils/format-edit-hold-line'
import { getArticleHold } from '../../../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../../../articles/utils/get-held-action-flags'
import type { EpisodeRowRecord } from './episode-row-select'
import { getEpisodeFactLine } from './get-episode-fact-line'
import { getEpisodeRowActions } from './get-episode-row-actions'
import { getMissingEpisodeContent } from './get-missing-episode-content'

type Options = {
  context: Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>
  now: Date
  isPodcastPublished: boolean
  isNumberTaken: boolean
  isSlugTaken: boolean
}

/**
 * An episode row, wherever the row stands (design 27b, 27f, 27h, 07c): what
 * the role may do, held back while someone else edits it, with the one action
 * on the row and the rest in „⋯“.
 *
 * @param episode - The row's columns (`EPISODE_ROW_SELECT`).
 * @param options.context - The author permission context, loaded with the
 *   actions view, update, delete, publish, retract, archive, restore and
 *   review on `podcast_episode`.
 * @param options.now - The moment of the load, which decides whether a hold
 *   has expired.
 * @param options.isPodcastPublished - Until its podcast is published, an
 *   episode is neither submitted nor published (27f).
 * @param options.isNumberTaken - Another episode of the podcast holds its
 *   number as published (log 0047).
 * @param options.isSlugTaken - Another episode of the podcast holds its
 *   address as published (log 0039).
 * @returns The row's actions, the bulk actions it joins, its tag state and
 *   fact, who holds it, and what its dialogs say.
 */
export const getEpisodeRow = (
  episode: EpisodeRowRecord,
  { context, now, isPodcastPublished, isNumberTaken, isSlugTaken }: Options,
) => {
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(episode, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn
  const unheldFlags = getContentActionFlags(context, 'podcast_episode', {
    authors: [episode.author],
    reviews: episode.reviews,
    state: episode.state,
    submittedAt: episode.submittedAt,
  })
  // While someone else edits it, its edit and state actions wait; the
  // Coordinator's Upravit opens the takeover (27b, as 26i).
  const flags = getHeldActionFlags(unheldFlags, { isApprover, isHeldByOther })
  const submission = flags.submission?.state ?? null
  const rowActions = getEpisodeRowActions({
    ...flags,
    canEdit: flags.canEdit || flags.canTakeOver,
    isPodcastPublished,
    state: episode.state,
    submission,
  })
  const bulkActions = getBulkActions({
    ...getEpisodeRowActions({
      ...unheldFlags,
      isPodcastPublished,
      state: episode.state,
      submission,
    }),
    isApprover,
  })

  return {
    ...rowActions,
    authorName: episode.author.name,
    // What the selection bar may apply to this row (22c, 27b): nothing is
    // published while the podcast isn't (27f); a held one is skipped and
    // said apart, not left out of the bar's actions.
    bulkActions,
    // The row's tag says what the detail's does (07a), with one fact (27b).
    factLine: getEpisodeFactLine({
      authorName: episode.author.name,
      state: episode.state,
      submission: flags.submission,
      updatedAt: episode.updatedAt,
    }),
    heldUntil: hold?.heldUntil.toISOString() ?? null,
    // Who edits it, ahead of the author and the fact (27b, as 26i); the list
    // looks again when it should expire.
    holdLine:
      hold === null
        ? null
        : formatEditHoldLine({
            holderName: hold.heldByName,
            isOwn: hold.isOwn,
            now,
          }),
    id: episode.id,
    isHeldByOther,
    // Bulk publishing skips it and says so up front (27h, 27b).
    isIncomplete:
      isApprover &&
      getMissingEpisodeContent({
        description: episode.description,
        isNumberTaken,
        isSlugTaken,
        links: episode.links,
        number: episode.number,
        title: episode.title,
      }).length > 0,
    // Publishing it, the dialog says it isn't submitted (23f).
    isNotSubmitted:
      episode.state === 'draft' &&
      flags.submission === null &&
      flags.isSubmittable &&
      !flags.isOwnContent,
    // On an unpublished podcast a waiting or approved episode has no bulk
    // action, yet the Coordinator selects it to hear why it can't be
    // published (27b, 27f).
    isSelectable:
      bulkActions.length > 0 ||
      (isApprover &&
        !isPodcastPublished &&
        getBulkActions({
          ...getEpisodeRowActions({
            ...unheldFlags,
            isPodcastPublished: true,
            state: episode.state,
            submission,
          }),
          isApprover,
        }).includes('publish')),
    linkLabels: episode.links.map((link) => link.label),
    number: episode.number,
    publishedAt: episode.publishedAt?.toISOString() ?? null,
    slug: episode.slug,
    state: episode.state,
    submission,
    title: episode.title,
  }
}

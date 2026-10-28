import { data, href, redirect } from 'react-router'

import { formatEditHoldLine } from '~/routes/administration/articles/utils/format-edit-hold-line'
import { getArticleHold } from '~/routes/administration/articles/utils/get-article-hold'
import { getHeldActionFlags } from '~/routes/administration/articles/utils/get-held-action-flags'
import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

import { getPodcastHeaderActions } from '../../utils/get-podcast-header-actions'
import type { Route } from './+types/route'
import { loadEpisodeTable } from './utils/load-episode-table.server'

export const loader = async ({ request, params, url }: Route.LoaderArgs) => {
  const { podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'create',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['podcast', 'podcast_episode'],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      // An empty draft never counts, nor blocks the delete (log 0020).
      _count: { select: { episodes: { where: NON_EMPTY_EPISODE_WHERE } } },
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              level: true,
            },
          },
        },
      },
      cover: {
        select: imageSourceSelect,
      },
      createdAt: true,
      description: true,
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      id: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
      title: true,
    },
    where: { id: podcastId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // An empty draft has no detail yet (log 0020): its editor is the page.
  if (podcast.firstContentAt === null) {
    throw redirect(
      href('/administration/podcasts/:podcastId/edit-podcast', { podcastId }),
    )
  }

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const now = new Date()
  const hold = getArticleHold(podcast, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn

  // While someone else edits it, its edit and state actions wait (07g); the
  // transitions check it again in their own writes. The Coordinator keeps
  // Upravit, whose editor offers the takeover (24g).
  const heldFlags = getHeldActionFlags(
    getContentActionFlags(context, 'podcast', {
      authors: [podcast.author],
      reviews: podcast.reviews,
      state: podcast.state,
      submittedAt: podcast.submittedAt,
    }),
    { isApprover, isHeldByOther },
  )
  const flags = {
    ...heldFlags,
    canEdit: heldFlags.canEdit || heldFlags.canTakeOver,
  }

  const submission = flags.submission?.state ?? null

  // Read only here: an earlier redirect must not use up the toast (as 27c).
  const notice = await readAdminNotice(request)

  // First: the table's default or stale filter redirects before the rest
  // of the page is loaded.
  const episodeTable = await loadEpisodeTable({
    context,
    podcast,
    request,
    url,
  })

  const [history, publishedEpisodeCount] = await Promise.all([
    getContentHistory({
      createdAt: podcast.createdAt,
      entity: 'podcast',
      entityId: podcast.id,
      publishedAt: podcast.publishedAt,
    }),
    // What the archive dialog says leaves the web with it (27a).
    prisma.podcastEpisode.count({
      where: { podcastId: podcast.id, state: 'published' },
    }),
  ])

  return data(
    {
      canCreateEpisode: context.can({
        action: 'create',
        entity: 'podcast_episode',
        state: 'draft',
        targetAuthorIds: [context.authorId],
      }).hasPermission,
      episodeTable,
      // One primary, one outline beside Nová epizoda, the rest in „⋯“ (27b, 27i).
      headerActions: getPodcastHeaderActions({
        ...flags,
        state: podcast.state,
        submission,
      }),
      // „Podcast právě upravuje …“ in place of the buttons (07g), and when the
      // page looks again: an expiry sends no event.
      heldByName: isHeldByOther ? hold.heldByName : null,
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      isApprover,
      // One's own editor in another tab: Smazat… waits and says so (0036).
      isHeldInOwnOtherTab: hold?.isOwn === true,
      podcast: {
        authorName: podcast.author.name,
        cover:
          podcast.cover === null
            ? null
            : createImageSources('podcast-cover', podcast.cover),
        description: podcast.description,
        episodeCount: podcast._count.episodes,
        history,
        // Who edits it while held, in the meta line (as 27c, 23g).
        holdLine:
          hold === null
            ? null
            : formatEditHoldLine({
                holderName: hold.heldByName,
                isOwn: hold.isOwn,
                now,
                since: hold.heldSince,
              }),
        id: podcast.id,
        // The date only of a podcast on the web (27b).
        publishedDate:
          podcast.state === 'published' && podcast.publishedAt !== null
            ? formatNumericDate(podcast.publishedAt)
            : null,
        publishedEpisodeCount,
        slug: podcast.slug,
        state: podcast.state,
        // A draft saved without a title goes by a name (copy utgh1hb7).
        title: getPodcastDisplayTitle(podcast.title),
      },
      submission,
      // „Podcast právě upravuje …“ after a direct address of its editor.
      toast: notice.toast,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}

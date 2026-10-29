import { data, href, redirect } from 'react-router'

import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { getWebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { buildWebVisibleEpisodeWhere } from '~/utils/podcast-episode/build-web-visible-episode-where'

import { formatEditHoldLine } from '../../../../../articles/utils/format-edit-hold-line'
import { getArticleFactLine } from '../../../../../articles/utils/get-article-fact-line'
import { getArticleHold } from '../../../../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../../../../articles/utils/get-held-action-flags'
import { getEpisodeHeaderActions } from '../../utils/get-episode-header-actions'
import { getUnpublishedPodcastAdvice } from '../../utils/get-unpublished-podcast-advice'
import { getUnpublishedPodcastPredicate } from '../../utils/get-unpublished-podcast-predicate'
import { isValidEpisodeLinkUrl } from '../../utils/is-valid-episode-link-url'
import { loadMissingEpisodeContent } from '../../utils/load-missing-episode-content.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { episodeId, podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['podcast_episode'],
  })

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
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
        select: { ...imageSourceSelect, altText: true },
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
      links: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, url: true },
      },
      number: true,
      podcast: {
        select: {
          cover: { select: imageSourceSelect },
          id: true,
          slug: true,
          state: true,
          title: true,
        },
      },
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
      updatedAt: true,
    },
    where: { id: episodeId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e);
  // so is an episode under another podcast's address, as in its editor.
  if (!canView || episode.podcast.id !== podcastId) {
    throw data(null, { status: 404 })
  }

  // An empty draft has no detail yet (log 0020): its editor is the page.
  if (episode.firstContentAt === null) {
    throw redirect(
      href(
        '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
        { episodeId, podcastId: episode.podcast.id },
      ),
    )
  }

  const now = new Date()
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(episode, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn

  const roleFlags = getContentActionFlags(context, 'podcast_episode', {
    authors: [episode.author],
    reviews: episode.reviews,
    state: episode.state,
    submittedAt: episode.submittedAt,
  })

  // Until its podcast is published, an episode is neither submitted nor
  // published (27f); the server refuses both too, and the header leaves them
  // out. Where the role could, it says why instead.
  const isPodcastPublished = episode.podcast.state === 'published'
  const isPodcastUnpublishedShown =
    !isPodcastPublished &&
    !isHeldByOther &&
    episode.state === 'draft' &&
    (roleFlags.canSubmit || roleFlags.canPublish)

  // While someone else edits it, its edit and state actions wait (07g, 27c);
  // the transitions check it again in their own writes.
  const flags = getHeldActionFlags(roleFlags, { isApprover, isHeldByOther })
  const submission = flags.submission?.state ?? null

  // The link to the web only where the public page would open the episode
  // (tly4a163); a draft without an address has no page yet.
  const visibleWhere = buildWebVisibleEpisodeWhere(
    await getWebContentVisibility(request, ['podcast', 'podcast_episode']),
  )

  const [history, visibleCount, missingBeforePublish] = await Promise.all([
    getContentHistory({
      createdAt: episode.createdAt,
      entity: 'podcast_episode',
      entityId: episode.id,
      publishedAt: episode.publishedAt,
    }),
    episode.slug === ''
      ? 0
      : prisma.podcastEpisode.count({
          where: {
            id: episode.id,
            podcast: visibleWhere.podcast,
            ...visibleWhere.episode,
          },
        }),
    // Publishing an incomplete episode opens the 27h sentence instead of the
    // date; only the Coordinator publishes, and the server checks again.
    flags.canPublish && isPodcastPublished && episode.state === 'draft'
      ? loadMissingEpisodeContent(episode.id)
      : [],
  ])
  const isOnWeb = visibleCount > 0

  // Without its own cover, the podcast's stands in, muted (5hl7vx3a).
  const getCover = () => {
    if (episode.cover !== null) {
      return {
        altText: episode.cover.altText,
        isOwn: true,
        sources: createImageSources('podcast-episode-cover', episode.cover),
      }
    }
    if (episode.podcast.cover !== null) {
      return {
        altText: '',
        isOwn: false,
        sources: createImageSources('podcast-cover', episode.podcast.cover),
      }
    }
    return null
  }

  // Read only here: an earlier redirect must not use up the toast (27c, as 26i).
  const notice = await readAdminNotice(request)

  return data(
    {
      episode: {
        authorName: episode.author.name,
        cover: getCover(),
        description: episode.description,
        // Who edits it while held (27c, as 23g).
        factLine:
          hold === null
            ? getArticleFactLine({
                now,
                publishedAt: episode.publishedAt,
                state: episode.state,
                submission: flags.submission,
                updatedAt: episode.updatedAt,
              })
            : formatEditHoldLine({
                holderName: hold.heldByName,
                isOwn: hold.isOwn,
                now,
                since: hold.heldSince,
              }),
        history,
        id: episode.id,
        // A draft saves any address (2o0uwhgp); only a valid one is a link.
        links: episode.links.map((link) => ({
          ...link,
          isValid: isValidEpisodeLinkUrl(link.url),
        })),
        number: episode.number,
        podcast: {
          id: episode.podcast.id,
          slug: episode.podcast.slug,
          // A podcast saved without a title goes by a name (copy utgh1hb7).
          title: getPodcastDisplayTitle(episode.podcast.title),
        },
        publishedAt: episode.publishedAt?.toISOString() ?? null,
        slug: episode.slug,
        state: episode.state,
        title: episode.title,
      },
      headerActions: getEpisodeHeaderActions({
        ...flags,
        isHeldByOther,
        isOnWeb,
        isPodcastPublished,
        isPodcastUnpublishedShown,
        state: episode.state,
        submission,
      }),
      // „Epizodu právě upravuje …“ in place of the buttons (27c, 07g), and when
      // the page looks again: an expiry sends no event.
      heldByName: isHeldByOther ? hold.heldByName : null,
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      isApprover,
      // One's own editor in another tab: Smazat… waits and says so (23g, 0036).
      isHeldInOwnOtherTab: hold?.isOwn === true,
      isOnWeb,
      isOwnContent: flags.isOwnContent,
      missingBeforePublish,
      // Why it can't be submitted or published while the podcast is off the
      // web, by role and the podcast's state (27f).
      podcastUnpublished: isPodcastUnpublishedShown
        ? {
            advice: getUnpublishedPodcastAdvice({
              isApprover,
              podcastState: episode.podcast.state,
            }),
            predicate: getUnpublishedPodcastPredicate(episode.podcast.state),
          }
        : null,
      submission,
      // „Epizodu právě upravuje …“ after a direct address of its editor (27c).
      toast: notice.toast,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}

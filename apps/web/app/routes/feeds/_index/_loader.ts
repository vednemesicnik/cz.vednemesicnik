import { href } from 'react-router'
import { prisma } from '~/utils/db.server'
import { toAbsoluteUrl } from '~/utils/feeds/to-absolute-url.server'

/**
 * The feeds on offer. Feeds are public, so the page lists only published
 * podcasts, for a signed-in author too (17b: no editorial preview here).
 */
export const loader = async () => {
  // As /podcasts: the newest published podcast first (the owner's call of
  // 9 Nov 2026 over 13a). A podcast without an episode is listed too, since its
  // first episode still reaches the reader (17b).
  const podcasts = await prisma.podcast.findMany({
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      publishedSlug: true,
      title: true,
    },
    where: { state: 'published' },
  })

  const podcastFeeds = podcasts.flatMap(({ id, publishedSlug, title }) =>
    publishedSlug === null
      ? []
      : [
          {
            address: toAbsoluteUrl(
              href('/feeds/podcasts/:podcastId.xml', { podcastId: id }),
            ),
            anchor: `podcast-${publishedSlug}`,
            id,
            title,
          },
        ],
  )

  return {
    archiveAddress: toAbsoluteUrl(href('/feeds/archive.xml')),
    articlesAddress: toAbsoluteUrl(href('/feeds/articles.xml')),
    podcastFeeds,
  }
}

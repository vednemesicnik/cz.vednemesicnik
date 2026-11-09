import { href } from 'react-router'
import { prisma } from '~/utils/db.server'
import { toAbsoluteUrl } from '~/utils/feeds/to-absolute-url.server'
import { sortByNewestEpisode } from '~/utils/podcast/sort-by-newest-episode'

/**
 * The feeds on offer. Feeds are public, so the page lists only published
 * podcasts, for a signed-in author too (17b: no editorial preview here).
 */
export const loader = async () => {
  const podcasts = await prisma.podcast.findMany({
    select: {
      episodes: {
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true },
        take: 1,
        where: { state: 'published' },
      },
      id: true,
      publishedSlug: true,
      title: true,
    },
    where: { state: 'published' },
  })

  // As /podcasts in 13a. A podcast without an episode is listed too, since its
  // first episode still reaches the reader (17b).
  const podcastFeeds = sortByNewestEpisode(podcasts).flatMap(
    ({ id, publishedSlug, title }) =>
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

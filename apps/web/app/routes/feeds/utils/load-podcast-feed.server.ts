import { href } from 'react-router'
import { FEED_ITEM_LIMIT } from '~/config/feed-config'
import { SITE_NAME } from '~/config/site-config'
import { prisma } from '~/utils/db.server'
import type { Feed } from '~/utils/feeds/feed-types'
import { toAbsoluteUrl } from '~/utils/feeds/to-absolute-url.server'

/**
 * One podcast's feed: its newest published episodes, each linking to the episode
 * page, where its platform links are. The feed is found by the podcast's id, so a
 * subscription outlives a change of the podcast's address (log 0039). It has no
 * audio and announces episodes in a feed reader only.
 *
 * @param podcastId - The podcast's id from the feed's address.
 * @param feedPath - The feed's own path, `.xml` or `.json`.
 * @returns The channel and its items, or `null` for a podcast that does not exist
 *   or is not published.
 */
export const loadPodcastFeed = async (
  podcastId: string,
  feedPath: string,
): Promise<Feed | null> => {
  const podcast = await prisma.podcast.findFirst({
    select: {
      description: true,
      episodes: {
        orderBy: { publishedAt: 'desc' },
        select: {
          description: true,
          publishedAt: true,
          publishedNumber: true,
          publishedSlug: true,
          title: true,
        },
        take: FEED_ITEM_LIMIT,
        where: { state: 'published' },
      },
      publishedSlug: true,
      title: true,
    },
    where: { id: podcastId, state: 'published' },
  })

  if (podcast === null || podcast.publishedSlug === null) return null

  const podcastSlug = podcast.publishedSlug

  return {
    channel: {
      // The podcast's own words; the 17a card sentence without them.
      description:
        podcast.description === ''
          ? 'Nové epizody ve čtečce novinek.'
          : podcast.description,
      feedUrl: toAbsoluteUrl(feedPath),
      link: toAbsoluteUrl(href('/podcasts/:podcastSlug', { podcastSlug })),
      title: `${SITE_NAME}: Podcast ${podcast.title}`,
    },
    items: podcast.episodes.flatMap(
      ({ description, publishedAt, publishedNumber, publishedSlug, title }) =>
        publishedSlug === null || publishedAt === null
          ? []
          : [
              {
                description: description === '' ? undefined : description,
                link: toAbsoluteUrl(
                  href('/podcasts/:podcastSlug/:episodeSlug', {
                    episodeSlug: publishedSlug,
                    podcastSlug,
                  }),
                ),
                publishedAt,
                // As the podcast page lists it: the number, then the title (13b).
                title:
                  publishedNumber === null
                    ? title
                    : `#${publishedNumber} ${title}`,
              },
            ],
    ),
  }
}

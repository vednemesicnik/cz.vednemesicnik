import { href } from 'react-router'
import { FEED_ITEM_LIMIT } from '~/config/feed-config'
import { SITE_NAME } from '~/config/site-config'
import { prisma } from '~/utils/db.server'
import type { Feed } from '~/utils/feeds/feed-types'
import { toAbsoluteUrl } from '~/utils/feeds/to-absolute-url.server'

/**
 * The articles feed: the newest published articles, linked at the address they
 * hold since their publish (log 0039). Readers have no session, so nothing
 * unpublished shows, not even to a signed-in author.
 *
 * @param feedPath - The feed's own path, `.xml` or `.json`.
 * @returns The channel (wording of the 17a card, copy uvjknd7d) and its items.
 */
export const loadArticlesFeed = async (feedPath: string): Promise<Feed> => {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    select: {
      authors: { select: { name: true } },
      perex: true,
      publishedAt: true,
      publishedSlug: true,
      title: true,
    },
    take: FEED_ITEM_LIMIT,
    where: { state: 'published' },
  })

  return {
    channel: {
      description: 'Nové články z našeho webu.',
      feedUrl: toAbsoluteUrl(feedPath),
      link: toAbsoluteUrl(href('/articles')),
      title: `${SITE_NAME}: Články`,
    },
    items: articles.flatMap(
      ({ authors, perex, publishedAt, publishedSlug, title }) =>
        publishedSlug === null || publishedAt === null
          ? []
          : [
              {
                author:
                  authors.length === 0
                    ? undefined
                    : authors.map(({ name }) => name).join(', '),
                description: perex ?? undefined,
                link: toAbsoluteUrl(
                  href('/articles/:articleSlug', {
                    articleSlug: publishedSlug,
                  }),
                ),
                publishedAt,
                title,
              },
            ],
    ),
  }
}

import { href } from 'react-router'
import { grants } from '~/data/grants'
import { prisma } from '~/utils/db.server'
import {
  createSitemapResponse,
  createSitemapXml,
  type SitemapEntry,
} from '~/utils/sitemap.server'

const toAbsoluteUrl = (path: string) => new URL(path, process.env.BASE_URL).href

export const loader = async () => {
  // Strictly published content: crawlers have no session, so the draft
  // relaxation the page loaders apply for signed-in authors does not belong here.
  const [articles, podcasts, episodes] = await Promise.all([
    prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      // The address an article holds since its publish (log 0039).
      select: { publishedSlug: true, updatedAt: true },
      where: { state: 'published' },
    }),
    prisma.podcast.findMany({
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, updatedAt: true },
      where: { state: 'published' },
    }),
    // An episode page also needs its podcast to be published, otherwise it 404s.
    prisma.podcastEpisode.findMany({
      orderBy: { publishedAt: 'desc' },
      // The address an episode holds in its podcast since its publish (log 0039).
      select: {
        podcast: { select: { slug: true } },
        publishedSlug: true,
        updatedAt: true,
      },
      where: { podcast: { state: 'published' }, state: 'published' },
    }),
  ])

  const staticPaths = [
    href('/'),
    href('/articles'),
    href('/podcasts'),
    href('/archive'),
    href('/editorial-board'),
    href('/organization'),
    href('/support'),
    href('/grants'),
  ]

  const entries: SitemapEntry[] = [
    ...staticPaths.map((path) => ({ loc: toAbsoluteUrl(path) })),
    ...grants.map((grant) => ({
      loc: toAbsoluteUrl(href('/grants/:grantSlug', { grantSlug: grant.slug })),
    })),
    ...articles.flatMap(({ publishedSlug, updatedAt }) =>
      publishedSlug === null
        ? []
        : [
            {
              lastmod: updatedAt,
              loc: toAbsoluteUrl(
                href('/articles/:articleSlug', { articleSlug: publishedSlug }),
              ),
            },
          ],
    ),
    ...podcasts.map((podcast) => ({
      lastmod: podcast.updatedAt,
      loc: toAbsoluteUrl(
        href('/podcasts/:podcastSlug', { podcastSlug: podcast.slug }),
      ),
    })),
    ...episodes.flatMap(({ podcast, publishedSlug, updatedAt }) =>
      publishedSlug === null
        ? []
        : [
            {
              lastmod: updatedAt,
              loc: toAbsoluteUrl(
                href('/podcasts/:podcastSlug/:episodeSlug', {
                  episodeSlug: publishedSlug,
                  podcastSlug: podcast.slug,
                }),
              ),
            },
          ],
    ),
  ]

  return createSitemapResponse(createSitemapXml(entries))
}

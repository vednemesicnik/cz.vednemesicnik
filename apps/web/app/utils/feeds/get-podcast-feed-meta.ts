import { href } from 'react-router'
import { SITE_NAME } from '~/config/site-config'

type Podcast = {
  id: string
  title: string
}

/**
 * The `<link rel="alternate">` tags of one podcast's feed, in RSS and JSON Feed,
 * for the meta of its page, its episodes and `/feeds`. Only a published podcast
 * has a feed; the caller leaves these out otherwise.
 *
 * @param podcast - The podcast's id, which the feed's address is built on, and
 *   its title.
 * @returns Meta descriptors that render as `<link>` tags.
 */
export const getPodcastFeedMeta = ({ id, title }: Podcast) => [
  {
    href: href('/feeds/podcasts/:podcastId.xml', { podcastId: id }),
    rel: 'alternate',
    tagName: 'link',
    title: `${SITE_NAME}: Podcast ${title} (RSS)`,
    type: 'application/rss+xml',
  } as const,
  {
    href: href('/feeds/podcasts/:podcastId.json', { podcastId: id }),
    rel: 'alternate',
    tagName: 'link',
    title: `${SITE_NAME}: Podcast ${title} (JSON Feed)`,
    type: 'application/feed+json',
  } as const,
]

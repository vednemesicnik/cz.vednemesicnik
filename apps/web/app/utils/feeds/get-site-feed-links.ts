import { href } from 'react-router'
import { SITE_NAME } from '~/config/site-config'

/**
 * The `<link rel="alternate">` tags of the feeds every website page offers to
 * browsers and feed readers: articles and the archive, each in RSS and JSON Feed.
 * Readers find JSON Feed only here; the `/feeds` page shows RSS (17a).
 *
 * @returns Link descriptors for a route's `links` export.
 */
export const getSiteFeedLinks = () => [
  {
    href: href('/feeds/articles.xml'),
    rel: 'alternate',
    title: `${SITE_NAME}: Články (RSS)`,
    type: 'application/rss+xml',
  },
  {
    href: href('/feeds/articles.json'),
    rel: 'alternate',
    title: `${SITE_NAME}: Články (JSON Feed)`,
    type: 'application/feed+json',
  },
  {
    href: href('/feeds/archive.xml'),
    rel: 'alternate',
    title: `${SITE_NAME}: Archiv čísel (RSS)`,
    type: 'application/rss+xml',
  },
  {
    href: href('/feeds/archive.json'),
    rel: 'alternate',
    title: `${SITE_NAME}: Archiv čísel (JSON Feed)`,
    type: 'application/feed+json',
  },
]

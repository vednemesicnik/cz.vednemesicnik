import { prisma } from '~/utils/db.server'
import {
  ownByAuthor,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import { NON_EMPTY_PODCAST_WHERE } from './non-empty-podcast-where'

/**
 * The podcast a public address names for this request (design 13b, 13c; log
 * 0039). Only a published address is unique: a reader gets the podcast that
 * holds it, and a draft or an archived podcast under its typed address shows
 * to whoever may see it in administration, the last edited first. An empty
 * draft never shows (log 0020).
 *
 * @param podcastSlug - The address from the URL.
 * @param visibility - What the web may show, from `getWebContentVisibility`
 *   for `podcast`.
 * @returns The podcast's id, or `null` when the address names none the
 *   visitor may see.
 */
export const findWebPodcast = async (
  podcastSlug: string,
  visibility: WebContentVisibility,
) =>
  (await prisma.podcast.findFirst({
    select: { id: true },
    where: { publishedSlug: podcastSlug, state: 'published' },
  })) ??
  (await prisma.podcast.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
    where: {
      AND: [visibility.where('podcast', ownByAuthor, ['draft', 'archived'])],
      slug: podcastSlug,
      ...NON_EMPTY_PODCAST_WHERE,
    },
  }))

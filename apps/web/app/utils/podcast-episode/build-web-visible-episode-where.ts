import {
  ownByAuthor,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import { NON_EMPTY_PODCAST_WHERE } from '../podcast/non-empty-podcast-where'
import { NON_EMPTY_EPISODE_WHERE } from './non-empty-episode-where'

/**
 * Which episodes the public episode page opens for this request (design 13c,
 * 27c): an episode only under a podcast the visitor can see, and drafts and
 * archived ones of either only as far as the signed-in author may view them
 * in administration. An empty draft of either never shows (log 0020). The
 * administration offers a link to the web only where this finds the episode
 * (tly4a163). The public lists build their own clauses; they don't use it.
 *
 * @param visibility - What the web may show, from `getWebContentVisibility`
 *   for `podcast` and `podcast_episode`.
 * @returns `podcast`, the clause for the episode's podcast, and `episode`,
 *   the clause for the episode itself; the caller adds the address or the id.
 */
export const buildWebVisibleEpisodeWhere = (
  visibility: WebContentVisibility,
) => ({
  episode: {
    ...visibility.where('podcast_episode', ownByAuthor, ['draft', 'archived']),
    ...NON_EMPTY_EPISODE_WHERE,
  },
  podcast: {
    ...visibility.where('podcast', ownByAuthor, ['draft', 'archived']),
    ...NON_EMPTY_PODCAST_WHERE,
  },
})

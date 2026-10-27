import type { ArticleAction } from '../../../../articles/utils/article-actions'
import { getRowActions } from '../../../../articles/utils/get-row-actions'
import type { EpisodeAction } from './episode-actions'

type Options = Parameters<typeof getRowActions>[0] & {
  isPodcastPublished: boolean
}

// The web shows only a published podcast's episodes, so until the podcast is
// published, an episode is neither submitted, published nor shown there (27f).
const NEEDS_PUBLISHED_PODCAST = new Set<ArticleAction>([
  'approve-and-publish',
  'publish',
  'submit',
  'view-on-web',
])

const isEpisodeRowAction = (
  action: ArticleAction,
  isPodcastPublished: boolean,
): action is EpisodeAction =>
  isPodcastPublished || !NEEDS_PUBLISHED_PODCAST.has(action)

/**
 * An episode's row actions (design 27b: as the article row's, 22a, 07c),
 * *Změnit datum publikace…* of a published one included (27c).
 *
 * @param options - The episode's state and submission, what the signed-in
 *   author may do with it, and whether its podcast is published.
 * @returns The row action and the „⋯“ items, in the article's order.
 */
export const getEpisodeRowActions = ({
  isPodcastPublished,
  ...options
}: Options) => {
  const { menu, row } = getRowActions(options)

  return {
    menu: menu.filter((action) =>
      isEpisodeRowAction(action, isPodcastPublished),
    ),
    row:
      row !== null && isEpisodeRowAction(row, isPodcastPublished) ? row : null,
  }
}

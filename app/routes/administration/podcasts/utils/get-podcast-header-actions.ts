import { getHeaderActions } from '../../articles/article/_index/utils/get-header-actions'
import type { ArticleAction } from '../../articles/utils/article-actions'
import { isTaxonomyAction } from '../../articles/utils/is-taxonomy-action'
import type { PodcastAction, PodcastMenuItem } from './podcast-actions'

type PodcastHeaderActions = {
  primary: PodcastAction | null
  outline: PodcastAction | null
  menu: PodcastMenuItem[]
}

type Options = Omit<
  Parameters<typeof getHeaderActions>[0],
  'canChangePublishedAt'
>

// The podcast's takeover is asked in its editor, so Upravit leads there (24g).
const asPodcastAction = (
  action: ArticleAction | null,
): PodcastAction | null => {
  if (action === 'take-over') return 'edit'

  return action !== null && isTaxonomyAction(action) ? action : null
}

/**
 * The podcast page's header (design 27b, 27i, 27j): the article's (07c) without
 * a publish date to change or its sentences, with Historie first in „⋯“. A
 * draft someone else edits keeps only Upravit for the Coordinator, submitted or
 * not, whose editor offers the takeover (24g).
 *
 * @param options - The podcast's state and submission, what the signed-in
 *   author may do with it, and whether someone else holds its edit.
 * @returns The primary and outline action and the „⋯“ items in order.
 */
export const getPodcastHeaderActions = (
  options: Options,
): PodcastHeaderActions => {
  const { menu, outline, primary } = getHeaderActions({
    ...options,
    canChangePublishedAt: false,
  })

  return {
    menu: ['history', ...menu.filter(isTaxonomyAction)],
    outline: asPodcastAction(outline),
    primary: asPodcastAction(primary),
  }
}

import { getRowActions } from '../../articles/utils/get-row-actions'
import { isTaxonomyAction } from '../../articles/utils/is-taxonomy-action'
import type { PodcastAction } from './podcast-actions'

type Options = Omit<Parameters<typeof getRowActions>[0], 'canChangePublishedAt'>

/**
 * A podcast's actions in one „⋯“ (design 27a, 27b, 07c): the row has no main
 * action, since Nová epizoda belongs on the podcast's page, so the article
 * row's action leads the menu.
 *
 * @param options - The podcast's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The actions in the 07c order, Smazat… last; what the role may not
 *   do is left out.
 */
export const getPodcastActions = (options: Options): PodcastAction[] => {
  const { menu, row } = getRowActions({
    ...options,
    canChangePublishedAt: false,
  })

  return (row === null ? menu : [row, ...menu]).filter(isTaxonomyAction)
}

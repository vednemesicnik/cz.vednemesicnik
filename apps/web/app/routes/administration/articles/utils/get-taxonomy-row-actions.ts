import { getRowActions } from './get-row-actions'
import { isTaxonomyAction } from './is-taxonomy-action'

type Options = Omit<Parameters<typeof getRowActions>[0], 'canChangePublishedAt'>

/**
 * A category's or tag's list row actions (design 25a): the article's (22a, 07c)
 * without a publish date to change.
 *
 * @param options - The record's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The row action and the „⋯“ items, in the article's order.
 */
export const getTaxonomyRowActions = (options: Options) => {
  const { menu, row } = getRowActions({
    ...options,
    canChangePublishedAt: false,
  })

  return {
    menu: menu.filter(isTaxonomyAction),
    row: row !== null && isTaxonomyAction(row) ? row : null,
  }
}

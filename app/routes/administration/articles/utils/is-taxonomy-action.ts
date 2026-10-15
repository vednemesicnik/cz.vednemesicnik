import type { TaxonomyAction } from './taxonomy-actions'

/**
 * Whether an article action applies to a category or tag: all but changing a
 * publish date, which they don't pick.
 *
 * @param action - An article's row or header action.
 * @returns `true` for every action except `change-date`.
 */
export const isTaxonomyAction = (
  action: TaxonomyAction | 'change-date',
): action is TaxonomyAction => action !== 'change-date'

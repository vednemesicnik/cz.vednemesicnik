import type { ArticleAction } from './article-actions'
import type { TaxonomyAction } from './taxonomy-actions'

/**
 * Whether an article action applies to a category or tag: all but changing a
 * publish date, which they don't pick, and taking over an edit hold, which
 * they don't have.
 *
 * @param action - An article's row or header action.
 * @returns `true` for every action except `change-date` and `take-over`.
 */
export const isTaxonomyAction = (
  action: ArticleAction,
): action is TaxonomyAction =>
  action !== 'change-date' && action !== 'take-over'

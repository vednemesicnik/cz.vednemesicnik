import { getHeaderActions } from '../article/_index/utils/get-header-actions'
import type { TaxonomyAction } from './taxonomy-actions'

type Options = Omit<
  Parameters<typeof getHeaderActions>[0],
  'canChangePublishedAt'
>

const isTaxonomyAction = (
  action: TaxonomyAction | 'change-date',
): action is TaxonomyAction => action !== 'change-date'

const asTaxonomyAction = (action: TaxonomyAction | 'change-date' | null) =>
  action !== null && isTaxonomyAction(action) ? action : null

/**
 * A category's or tag's detail header (design 25b): the article's (07c, 23d)
 * without a publish date to change. Its web preview is a link in Údaje, not a
 * header action (a3zejbc1).
 *
 * @param options - The record's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The primary and outline action, the „⋯“ items in order, and the
 *   key of the sentence shown beside or instead of them.
 */
export const getTaxonomyHeaderActions = (options: Options) => {
  const { menu, outline, primary, sentence } = getHeaderActions({
    ...options,
    canChangePublishedAt: false,
  })

  return {
    menu: menu.filter(isTaxonomyAction),
    outline: asTaxonomyAction(outline),
    primary: asTaxonomyAction(primary),
    sentence,
  }
}

import { getHeaderActions } from '../../articles/article/_index/utils/get-header-actions'
import type { ArticleAction } from '../../articles/utils/article-actions'
import type { IssueAction } from './issue-actions'

type Options = Omit<
  Parameters<typeof getHeaderActions>[0],
  'canChangePublishedAt' | 'isHeldByOther' | 'canTakeOver'
>

const isIssueAction = (action: ArticleAction): action is IssueAction =>
  action !== 'change-date' && action !== 'take-over'

const asIssueAction = (action: ArticleAction | null) =>
  action !== null && isIssueAction(action) ? action : null

/**
 * An issue's detail header (design 26b, 26g): the article's (07c, 23d) without
 * a publish date to change, as the archive is ordered by year and order, and
 * without an edit hold.
 *
 * @param options - The issue's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The primary and outline action, the „⋯“ items in order, and the
 *   key of the sentence shown beside or instead of them.
 */
export const getIssueHeaderActions = (options: Options) => {
  const { menu, outline, primary, sentence } = getHeaderActions({
    ...options,
    canChangePublishedAt: false,
  })

  return {
    menu: menu.filter(isIssueAction),
    outline: asIssueAction(outline),
    primary: asIssueAction(primary),
    sentence,
  }
}

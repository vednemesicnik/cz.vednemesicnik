import { getHeaderActions } from '../../articles/article/_index/utils/get-header-actions'
import type { ArticleAction } from '../../articles/utils/article-actions'
import type { IssueAction } from './issue-actions'

type Options = Omit<
  Parameters<typeof getHeaderActions>[0],
  'canChangePublishedAt'
>

const isIssueAction = (action: ArticleAction): action is IssueAction =>
  action !== 'change-date'

const asIssueAction = (action: ArticleAction | null) =>
  action !== null && isIssueAction(action) ? action : null

/**
 * An issue's detail header (design 26b, 26g, 26i): the article's (07c, 23d)
 * without a publish date to change, as the archive is ordered by year and
 * order. While someone else edits it, only the Coordinator's *Převzít úpravu…*.
 *
 * @param options - The issue's state and submission, what the signed-in
 *   author may do with it, and whether someone else holds its edit.
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

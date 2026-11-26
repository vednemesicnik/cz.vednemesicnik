import type { ArticleAction } from '../../articles/utils/article-actions'
import type { IssueAction } from './issue-actions'

/**
 * Whether an article action applies to an issue: all but changing a publish
 * date, as the archive is ordered by year and order (26h).
 *
 * @param action - An article's row or header action.
 * @returns `true` for every action except `change-date`.
 */
export const isIssueAction = (action: ArticleAction): action is IssueAction =>
  action !== 'change-date'

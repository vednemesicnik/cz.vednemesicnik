import { getRowActions } from '../../articles/utils/get-row-actions'
import { isIssueAction } from './is-issue-action'

type Options = Omit<Parameters<typeof getRowActions>[0], 'canChangePublishedAt'>

/**
 * An issue's list row actions (design 26a): the article's (22a, 07c) without a
 * publish date to change.
 *
 * @param options - The issue's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The row action and the „⋯“ items, in the article's order.
 */
export const getIssueRowActions = (options: Options) => {
  const { menu, row } = getRowActions({
    ...options,
    canChangePublishedAt: false,
  })

  return {
    menu: menu.filter(isIssueAction),
    row: row !== null && isIssueAction(row) ? row : null,
  }
}

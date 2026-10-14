import type { ArticleAction } from '../../utils/article-actions'

/** An action the selection bar applies to every selected article (design 22c). */
export type BulkAction = 'publish' | 'archive' | 'delete'

type Options = {
  row: ArticleAction | null
  menu: ArticleAction[]
  isApprover: boolean
}

/**
 * The bulk actions a row joins (design 22c): each only where the role and state
 * would allow it on the row itself (07c). Bulk publishing is the Coordinator's
 * only, and it approves a waiting article as „Schválit a publikovat…“ does.
 *
 * @param options - The row's actions from `getRowActions`, and whether the
 *   signed-in author approves (the Coordinator).
 * @returns The bulk actions in the bar's order: publish, archive, delete.
 */
export const getBulkActions = ({
  row,
  menu,
  isApprover,
}: Options): BulkAction[] => {
  const actions = [...(row === null ? [] : [row]), ...menu]
  const has = (action: ArticleAction) => actions.includes(action)

  return [
    ...(isApprover && (has('publish') || has('approve-and-publish'))
      ? (['publish'] as const)
      : []),
    ...(has('archive') ? (['archive'] as const) : []),
    ...(has('delete') ? (['delete'] as const) : []),
  ]
}

import type { BulkAction } from './get-bulk-actions'

/**
 * The bulk actions valid for every selected article (design 22c): an action
 * part of the selection blocks is not offered, never applied to part of it.
 *
 * @param selectedActions - Each selected article's bulk actions.
 * @returns The actions every one of them has, in the bar's order; empty for an
 *   empty selection.
 */
export const getCommonBulkActions = (
  selectedActions: BulkAction[][],
): BulkAction[] => {
  const [first, ...rest] = selectedActions

  if (first === undefined) return []

  return first.filter((action) =>
    rest.every((actions) => actions.includes(action)),
  )
}

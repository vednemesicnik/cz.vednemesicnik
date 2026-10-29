/**
 * An action the selection bar applies to every selected record (design 22c,
 * ji6n8th3), in the bar's order (07c).
 */
export type BulkAction =
  | 'publish'
  | 'retract'
  | 'archive'
  | 'restore'
  | 'delete'

type Options = {
  row: string | null
  menu: readonly string[]
  isApprover: boolean
}

// The row actions that are a bulk action of the same name (07c).
const SAME_NAMED: BulkAction[] = ['retract', 'archive', 'restore', 'delete']

/**
 * The bulk actions a row joins (design 22c, ji6n8th3): each only where the role
 * and state would allow it on the row itself (07c). Bulk publishing is the
 * Coordinator's only, and it approves a waiting record as „Schválit
 * a publikovat…“ does.
 *
 * @param options - The row's actions from `getRowActions` or a list's own
 *   variant of it, and whether the signed-in author approves (the Coordinator).
 * @returns The bulk actions in the bar's order: publish, retract, archive,
 *   restore, delete.
 */
export const getBulkActions = ({
  row,
  menu,
  isApprover,
}: Options): BulkAction[] => {
  const actions = [...(row === null ? [] : [row]), ...menu]
  const canPublish =
    isApprover &&
    (actions.includes('publish') || actions.includes('approve-and-publish'))

  return [
    ...(canPublish ? (['publish'] as const) : []),
    ...SAME_NAMED.filter((action) => actions.includes(action)),
  ]
}

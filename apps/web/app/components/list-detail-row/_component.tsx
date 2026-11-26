import type { ReactNode } from 'react'

import { AdminDetailRow } from '~/components/admin/admin-detail-row'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A detail row whose value is a list of items with their own action (design
 * 29a, 0p3dlr4w). The row has no actions column: each item's action stays at
 * the end of the item, and the row's action closes the value.
 *
 * @param props.children - An `AdminDetailRowLabel` and an
 *   `AdminDetailRowValue` that holds the list, the notes under it and, last,
 *   the `ListDetailRowActions`.
 */
export const ListDetailRow = ({ children, className }: Props) => (
  <AdminDetailRow align={'start'} className={className}>
    {children}
  </AdminDetailRow>
)

import type { ReactNode } from 'react'

import { AdminDetailRow } from '~/components/admin/admin-detail-row'

import styles from './_styles.module.css'

type Props = {
  label: ReactNode
  children: ReactNode
  actions: ReactNode
  className?: string
}

/**
 * A detail row whose value is a list of items with their own action (design
 * 29a, 0p3dlr4w). The row has no actions column: each item's action stays at
 * the end of the item, and the row's action closes the value, under the list
 * and its description, aligned left, so it never lines up with the items'
 * actions.
 *
 * @param props.label - The name in the name column.
 * @param props.children - The value: the list and the notes under it.
 * @param props.actions - The row's action, after the value, in a wrapping
 * row like `AdminDetailRow`'s actions; a full-width line takes
 * `flex-basis: 100%`.
 */
export const ListDetailRow = ({
  label,
  children,
  actions,
  className,
}: Props) => (
  <AdminDetailRow align={'start'} className={className} label={label}>
    {children}
    <div className={styles.actions}>{actions}</div>
  </AdminDetailRow>
)

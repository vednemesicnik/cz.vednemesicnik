import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableRowLink } from '~/components/admin/admin-table'

import styles from './_styles.module.css'

type Props = {
  to: string
  /** A draft without a title goes by its name, said quieter (22f). */
  isUntitled?: boolean
  className?: string
  children: ReactNode
}

/**
 * The title of a `DashboardRow`, as the link to its detail.
 *
 * @param props.to - The record's detail.
 */
export const DashboardRowTitle = ({
  to,
  isUntitled = false,
  className,
  children,
}: Props) => (
  <TableRowLink
    className={clsx(isUntitled && styles.untitled, className)}
    to={to}
  >
    {children}
  </TableRowLink>
)

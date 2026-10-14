import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  action?: ReactNode
  className?: string
  leadClassName?: string
}

/**
 * A list's header in one row: the headline on the left, the list's main
 * action on the right, on the headline's line; the action wraps under the
 * headline when the row is too narrow (22a).
 *
 * @param props.children - The headline, and what belongs under it, such as a
 * link to the work waiting in the list.
 * @param props.action - The list's main action, usually a primary `LinkButton`.
 * @param props.leadClassName - Styles the column that holds `children`.
 */
export const ListHeader = ({
  children,
  action,
  className,
  leadClassName,
}: Props) => {
  return (
    <header className={clsx(styles.row, className)}>
      <div className={clsx(styles.lead, leadClassName)}>{children}</div>
      {action}
    </header>
  )
}

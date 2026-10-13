import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * A list's header in one row: the headline on the left, the list's main
 * action on the right; the action wraps under the headline when the row is
 * too narrow (22a).
 *
 * @param props.children - The headline, and what belongs under it, such as a
 * link to the work waiting in the list.
 * @param props.action - The list's main action, usually a primary `LinkButton`.
 */
export const ListHeader = ({ children, action, className }: Props) => {
  return (
    <div className={clsx(styles.row, className)}>
      <div className={styles.lead}>{children}</div>
      {action}
    </div>
  )
}

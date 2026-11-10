import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One row of a `HistoryList`: what happened and who did it, the date and time
 * under it, and an optional note under that (07f).
 *
 * @param props.children - The `HistoryListEvent`, the `HistoryListTime` and a
 *   `HistoryListNote`
 * @returns The list item
 */
export const HistoryListEntry = ({ children, className }: Props) => {
  return <li className={clsx(styles.entry, className)}>{children}</li>
}

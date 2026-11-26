import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One sentence in place of an empty list, with a way on (design 11b, 11c):
 * "Tady zatím žádný článek není." + "Všechny články →".
 *
 * @param children - An `EmptyStateText`, then an `EmptyStateLink` to go
 *   instead. Without the link the sentence stands alone, e.g. an empty
 *   archive (14c).
 * @returns The empty state
 */
export const EmptyState = ({ children, className }: Props) => {
  return <div className={clsx(styles.emptyState, className)}>{children}</div>
}

import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The sentence of `EmptyState`, e.g. "Tady zatím žádný článek není." (11b).
 *
 * @returns The paragraph
 */
export const EmptyStateText = ({ children, className }: Props) => {
  return <p className={clsx(styles.text, className)}>{children}</p>
}

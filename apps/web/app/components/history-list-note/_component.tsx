import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A note under a `HistoryListEntry`'s time, e.g. the old and the new
 * publication date (07f).
 *
 * @param props.children - The note
 * @returns The note
 */
export const HistoryListNote = ({ children, className }: Props) => {
  return <span className={clsx(styles.note, className)}>{children}</span>
}

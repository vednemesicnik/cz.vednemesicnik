import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * An exception in a `BulkConfirmDialog`, in full ink: publishing, the records
 * that wait, were not submitted or are incomplete (26f).
 *
 * @param props.children - The sentence
 * @returns The paragraph
 */
export const BulkConfirmDialogNote = ({ children, className }: Props) => {
  return <p className={clsx(styles.note, className)}>{children}</p>
}

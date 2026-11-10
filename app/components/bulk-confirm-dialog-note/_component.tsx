import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A sentence of a `BulkConfirmDialog` in full ink (22c, 26f): Smazání je
 * nevratné. where the list says so, and publishing, the records that wait,
 * were not submitted or are incomplete.
 *
 * @param props.children - The sentence
 * @returns The paragraph
 */
export const BulkConfirmDialogNote = ({ children, className }: Props) => {
  return <p className={clsx(styles.note, className)}>{children}</p>
}

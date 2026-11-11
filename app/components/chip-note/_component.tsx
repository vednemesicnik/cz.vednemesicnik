import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A word after the `ChipLabel`, e.g. *archivovaný*.
 */
export const ChipNote = ({ children, className }: Props) => (
  <span className={clsx(styles.note, className)}>{children}</span>
)

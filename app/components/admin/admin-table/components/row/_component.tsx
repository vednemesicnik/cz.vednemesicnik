import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  // Tertiary text for a row out of play, e.g. an archived article (design 22a)
  muted?: boolean
  className?: string
}

export const TableRow = ({ children, muted = false, className }: Props) => {
  return (
    <tr className={clsx(styles.row, muted && styles.muted, className)}>
      {children}
    </tr>
  )
}

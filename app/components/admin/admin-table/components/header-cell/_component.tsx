import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  align?: 'left' | 'right'
  // "actions" right-aligns and shrinks the column to fit its controls
  variant?: 'default' | 'actions'
}

export const TableHeaderCell = ({
  children,
  align = 'left',
  variant = 'default',
}: Props) => {
  return (
    <th
      className={clsx(
        styles.headerCell,
        align === 'right' && styles.alignRight,
        variant === 'actions' && styles.actions,
      )}
    >
      {children}
    </th>
  )
}

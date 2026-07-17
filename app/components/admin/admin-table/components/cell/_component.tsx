import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  align?: 'left' | 'right'
  // "actions" right-aligns and shrinks the column to fit its controls
  variant?: 'default' | 'actions'
}

export const TableCell = ({
  children,
  align = 'left',
  variant = 'default',
}: Props) => {
  return (
    <td
      className={clsx(
        styles.cell,
        align === 'right' && styles.alignRight,
        variant === 'actions' && styles.actions,
      )}
    >
      {children}
    </td>
  )
}

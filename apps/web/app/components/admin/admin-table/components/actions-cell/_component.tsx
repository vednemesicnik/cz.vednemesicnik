import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableCell } from '../cell'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The row's actions, right-aligned. Below 768 px it is the folded row's 44 px
 * column, above the `TableRowLink` that covers the row, so „⋯“ never opens
 * the detail (design 32, 22g).
 */
export const TableActionsCell = ({ children, className }: Props) => (
  <TableCell
    className={clsx(styles.cell, className)}
    phonePart={'actions'}
    variant={'actions'}
  >
    {children}
  </TableCell>
)

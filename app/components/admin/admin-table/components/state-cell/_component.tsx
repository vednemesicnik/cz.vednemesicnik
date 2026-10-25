import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableCell } from '../cell'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The row's `StatusTag` with its one fact. Below 768 px it is the folded
 * row's second line, the fact beside the tag and wrapping under it (design
 * 32, 22g).
 */
export const TableStateCell = ({ children, className }: Props) => (
  <TableCell className={clsx(styles.cell, className)} phonePart={'state'}>
    {children}
  </TableCell>
)

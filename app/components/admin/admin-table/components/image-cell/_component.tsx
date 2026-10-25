import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableCell } from '../cell'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The row's image: a cover, an avatar. Below 768 px it stands left of the
 * folded row's lines at its desktop size, level with the first (design 32).
 */
export const TableImageCell = ({ children, className }: Props) => (
  <TableCell className={clsx(styles.cell, className)} phonePart={'image'}>
    {children}
  </TableCell>
)

import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableCell } from '../cell'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The cell that names the row: the name, usually a `TableRowLink`, over an
 * optional second line (`TableNameAddress`, `TableNameNote`). Below 768 px
 * it is the folded row's first line, 16 px (design 32, 22g).
 */
export const TableNameCell = ({ children, className }: Props) => (
  <TableCell className={clsx(styles.cell, className)} phonePart={'name'}>
    <span className={styles.name}>{children}</span>
  </TableCell>
)

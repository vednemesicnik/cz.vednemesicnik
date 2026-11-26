import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { TableCell } from '../cell'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The folded row's remaining lines, a phone's only (design 32, 22g): the
 * columns the phone leaves out, in their desktop order, each
 * `TableDetailsLine` joined with „·“ or on a line of its own. Numbers that
 * lose their header get a word (myx395rj); links are plain text.
 */
export const TableDetailsCell = ({ children, className }: Props) => (
  <TableCell className={clsx(styles.cell, className)} phonePart={'details'}>
    {children}
  </TableCell>
)

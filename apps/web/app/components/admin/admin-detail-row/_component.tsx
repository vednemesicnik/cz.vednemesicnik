import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  align?: 'center' | 'start'
  className?: string
}

/**
 * A row of an administration detail page (design bbih22nt): name · value ·
 * actions, with a hairline under it. The name stands above the value while
 * the section is narrower than 440 px.
 *
 * @param props.children - An `AdminDetailRowLabel`, an `AdminDetailRowValue`
 *   and, for buttons on the right, `AdminDetailRowActions`.
 * @param props.align - `start` for a value taller than one line.
 */
export const AdminDetailRow = ({
  children,
  align = 'center',
  className,
}: Props) => (
  <div
    className={clsx(styles.row, align === 'start' && styles.start, className)}
  >
    {children}
  </div>
)

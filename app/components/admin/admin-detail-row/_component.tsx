import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  label: ReactNode
  children: ReactNode
  actions?: ReactNode
  align?: 'center' | 'start'
  className?: string
}

/**
 * A row of an administration detail page (design bbih22nt): name · value ·
 * actions, with a hairline under it. The name stands above the value while
 * the section is narrower than 480 px.
 *
 * @param props.label - The name in the name column.
 * @param props.children - The value: a status, a note, a list.
 * @param props.actions - Buttons on the right of the row.
 * @param props.align - `start` for a value taller than one line.
 */
export const AdminDetailRow = ({
  label,
  children,
  actions,
  align = 'center',
  className,
}: Props) => (
  <div
    className={clsx(styles.row, align === 'start' && styles.start, className)}
  >
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{children}</div>
    {actions !== undefined && <div className={styles.actions}>{actions}</div>}
  </div>
)

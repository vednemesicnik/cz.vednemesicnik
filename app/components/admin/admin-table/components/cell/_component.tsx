import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

/** Where a cell goes in a folded row below 768 px (design 32). */
export type TablePhonePart = 'image' | 'name' | 'state' | 'details' | 'actions'

type Props = {
  children: ReactNode
  align?: 'left' | 'right'
  // "actions" right-aligns and shrinks the column to fit its controls
  variant?: 'default' | 'actions'
  phonePart?: TablePhonePart
  className?: string
}

/**
 * A cell of the administration table.
 *
 * @param props.phonePart - Set by the folded row's parts (`TableNameCell`, …):
 *   below 768 px, where the table folds, a cell without one is hidden.
 */
export const TableCell = ({
  children,
  align = 'left',
  variant = 'default',
  phonePart,
  className,
}: Props) => {
  return (
    <td
      className={clsx(
        styles.cell,
        align === 'right' && styles.alignRight,
        variant === 'actions' && styles.actions,
        className,
      )}
      data-phone-part={phonePart}
    >
      {children}
    </td>
  )
}

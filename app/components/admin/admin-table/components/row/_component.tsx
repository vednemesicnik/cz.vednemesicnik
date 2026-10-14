import { clsx } from 'clsx'
import type { ReactNode, Ref } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  // Tertiary text for a row out of play, e.g. an archived article (design 22a)
  muted?: boolean
  className?: string
  ref?: Ref<HTMLTableRowElement>
}

export const TableRow = ({
  children,
  muted = false,
  className,
  ref,
}: Props) => {
  return (
    <tr
      className={clsx(styles.row, muted && styles.muted, className)}
      ref={ref}
    >
      {children}
    </tr>
  )
}

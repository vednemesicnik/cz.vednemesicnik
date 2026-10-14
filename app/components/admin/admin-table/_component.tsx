import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  // Dims the table and shows a spinner overlay during navigation
  pending?: boolean
  // Sticks thead to the page where the table fits without sideways scroll
  stickyHeader?: boolean
  className?: string
}

export const AdminTable = ({
  children,
  pending = false,
  stickyHeader = false,
  className,
}: Props) => {
  return (
    <div
      aria-busy={pending}
      className={clsx(
        styles.scrollArea,
        stickyHeader && styles.stickyArea,
        className,
      )}
    >
      <table className={clsx(styles.table, pending && styles.pending)}>
        {children}
      </table>
      {pending && <span aria-hidden={true} className={styles.spinner} />}
    </div>
  )
}

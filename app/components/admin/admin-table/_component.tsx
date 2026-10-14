import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  pending?: boolean
  stickyHeader?: boolean
  className?: string
}

/**
 * The administration's table (design 22a): no box, lines between rows. Only
 * the page scrolls; the table scrolls sideways where it does not fit.
 *
 * @param props.pending - Dims the table and shows a spinner during navigation.
 * @param props.stickyHeader - Sticks the header to the page where the table fits without sideways scroll (from 1024 px).
 * @returns The table in its scroll wrapper
 */
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

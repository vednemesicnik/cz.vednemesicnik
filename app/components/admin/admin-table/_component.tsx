import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  pending?: boolean
  stickyHeader?: boolean
  columnsClassName?: string
  className?: string
}

/**
 * The administration's table (design 22a): no box, lines between rows. Only
 * the page scrolls; the table scrolls sideways where it does not fit.
 *
 * Below a 1280 px table the columns size themselves as a native table. From
 * 1280 px a table with `columnsClassName` lays out as a grid whose rows share
 * its tracks, so the list sets its widths by weight (design 31a). The wrapper
 * is the `admin-table` inline-size container: a list's templates and cells
 * query it by name, with literal widths.
 *
 * @param props.pending - Dims the table and shows a spinner during navigation.
 * @param props.stickyHeader - Sticks the header to the page where the table fits without sideways scroll (from 1024 px).
 * @param props.columnsClassName - A class from the list's CSS module that sets
 *   `grid-template-columns` for the wide table: one track per visible column,
 *   each cell's 12 px padding included (14 px at the row's ends). Without it
 *   the table stays native at every width.
 * @returns The table in its scroll wrapper
 */
export const AdminTable = ({
  children,
  pending = false,
  stickyHeader = false,
  columnsClassName,
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
      <table
        className={clsx(
          styles.table,
          columnsClassName !== undefined && [styles.weighted, columnsClassName],
          pending && styles.pending,
        )}
      >
        {children}
      </table>
      {pending && <span aria-hidden={true} className={styles.spinner} />}
    </div>
  )
}

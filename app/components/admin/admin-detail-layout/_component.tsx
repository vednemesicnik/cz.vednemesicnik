import { clsx } from 'clsx'
import { Children, type ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  main: ReactNode
  aside?: ReactNode
  className?: string
}

/**
 * The two columns of an administration detail page (design bbih22nt): the
 * right column stands beside the main one while the main keeps at least
 * 480 px, otherwise under it. An empty right column is not drawn.
 *
 * @param props.main - The sections of the main column.
 * @param props.aside - The sections of the right column, if any.
 */
export const AdminDetailLayout = ({ main, aside, className }: Props) => {
  const hasAside = Children.toArray(aside).length > 0

  return (
    <div className={clsx(styles.container, className)}>
      <div className={clsx(styles.layout, hasAside && styles.withAside)}>
        <div className={styles.column}>{main}</div>
        {hasAside && <div className={styles.column}>{aside}</div>}
      </div>
    </div>
  )
}

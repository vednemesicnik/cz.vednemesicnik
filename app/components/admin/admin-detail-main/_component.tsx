import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The main column of `AdminDetailLayout` (design bbih22nt).
 *
 * @param props.children - The column's sections.
 */
export const AdminDetailMain = ({ children }: Props) => {
  return (
    <div className={styles.column} data-column={'main'}>
      {children}
    </div>
  )
}

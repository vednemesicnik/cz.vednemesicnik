import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
}

/**
 * The right column of `AdminDetailLayout` (design bbih22nt), an `<aside>`
 * beside the page's main content. Sections may be conditional: when none
 * renders, the column is empty and not drawn, and the main column takes the
 * full width.
 *
 * @param props.children - The column's sections.
 */
export const AdminDetailAside = ({ children }: Props) => {
  return (
    <aside className={styles.column} data-column={'aside'}>
      {children}
    </aside>
  )
}

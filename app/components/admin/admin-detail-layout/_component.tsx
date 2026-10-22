import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The two columns of an administration detail page (design bbih22nt), filled
 * with `AdminDetailMain` and `AdminDetailAside`: the right column stands beside
 * the main one from 732 px of container, narrower until 900 px, otherwise
 * under it (8kd9crag). An empty right column is not drawn.
 *
 * @param props.children - `AdminDetailMain`, then `AdminDetailAside` if any.
 */
export const AdminDetailLayout = ({ children, className }: Props) => {
  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.layout}>{children}</div>
    </div>
  )
}

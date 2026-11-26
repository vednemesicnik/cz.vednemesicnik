import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  measure?: 'text' | 'form'
}

/**
 * An administration page. A list runs the full width; a detail or an editor
 * names its main column's measure and becomes one block with its breadcrumbs,
 * centred in the area next to the sidebar (design 31, 8kd9crag).
 *
 * @param props.measure - `text` for a detail (620 px), `form` for an editor (640 px).
 */
export const AdminPage = ({ children, className, measure }: Props) => {
  return (
    <div className={clsx(styles.page, className)} data-measure={measure}>
      {children}
    </div>
  )
}

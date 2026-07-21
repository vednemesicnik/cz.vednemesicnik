import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Variant = 'info' | 'warning'

type Props = {
  children: ReactNode
  actions?: ReactNode
  variant?: Variant
  className?: string
}

// A notice with an optional row of action buttons. Unlike Callout (plain
// informative text), Banner is meant to prompt the user to do something.
export const Banner = ({
  children,
  actions,
  variant = 'info',
  className,
}: Props) => {
  return (
    <aside
      className={clsx(
        styles.banner,
        variant === 'warning' && styles.warning,
        className,
      )}
      role={'status'}
    >
      <div className={styles.message}>{children}</div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </aside>
  )
}

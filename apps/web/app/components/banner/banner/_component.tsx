import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Variant = 'info' | 'warning'

type Props = {
  children: ReactNode
  variant?: Variant
  className?: string
}

// A notice with an optional row of action buttons. Compose with BannerContent
// and BannerActions — Banner is a grid whose slots each carry their own
// grid-area, so children land in place regardless of order and stack on narrow
// screens.
export const Banner = ({ children, variant = 'info', className }: Props) => {
  return (
    <aside
      className={clsx(
        styles.banner,
        variant === 'warning' && styles.warning,
        className,
      )}
      role={'status'}
    >
      {children}
    </aside>
  )
}

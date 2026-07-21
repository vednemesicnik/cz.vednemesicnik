import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Variant = 'info' | 'warning'

type BannerProps = {
  children: ReactNode
  variant?: Variant
  className?: string
}

type SlotProps = {
  children: ReactNode
  className?: string
}

// A notice with an optional row of action buttons. Composable via the
// BannerContent / BannerActions slots — each carries its own grid-area, so
// children land in place regardless of order and stack on narrow screens.
export const Banner = ({
  children,
  variant = 'info',
  className,
}: BannerProps) => {
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

export const BannerContent = ({ children, className }: SlotProps) => {
  return <div className={clsx(styles.content, className)}>{children}</div>
}

export const BannerActions = ({ children, className }: SlotProps) => {
  return <div className={clsx(styles.actions, className)}>{children}</div>
}

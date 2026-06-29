import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const HeadlineIcon = ({ children, className }: Props) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {/* Expanding ripple behind the stamp — only painted during the view
          transition; sits at opacity 0 on the settled page. */}
      <span aria-hidden className={styles.halo} />
      <div className={styles.icon}>{children}</div>
    </div>
  )
}

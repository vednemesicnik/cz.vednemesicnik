import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  label: string
  children: ReactNode
  className?: string
}

export const AdminDetailItem = ({ label, children, className }: Props) => {
  return (
    <div className={clsx(styles.item, className)}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

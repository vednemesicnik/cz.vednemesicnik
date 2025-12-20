import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  title?: string
  children: ReactNode
  className?: string
}

export const AdminDetailSection = ({ title, children, className }: Props) => {
  return (
    <section className={clsx(styles.section, className)}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.content}>{children}</div>
    </section>
  )
}

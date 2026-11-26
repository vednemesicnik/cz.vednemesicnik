import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const TableHeader = ({ children, className }: Props) => {
  return (
    <thead className={clsx(styles.header, className)}>
      <tr>{children}</tr>
    </thead>
  )
}

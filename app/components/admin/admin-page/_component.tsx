import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const AdminPage = ({ children, className }: Props) => {
  return <div className={clsx(styles.page, className)}>{children}</div>
}

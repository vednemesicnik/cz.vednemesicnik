import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const AdministrationContent = ({ children, className }: Props) => {
  return <main className={clsx(styles.page, className)}>{children}</main>
}

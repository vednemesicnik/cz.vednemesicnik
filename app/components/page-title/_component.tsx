import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const PageTitle = ({ children, className }: Props) => {
  return <h1 className={clsx(styles.pageTitle, className)}>{children}</h1>
}

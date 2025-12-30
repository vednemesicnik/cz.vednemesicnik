import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const GroupName = ({ children, className }: Props) => {
  return <h2 className={clsx(styles.label, className)}>{children}</h2>
}

import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const AdminModalContent = ({ children, className }: Props) => {
  return <div className={clsx(styles.content, className)}>{children}</div>
}

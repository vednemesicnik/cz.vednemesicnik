import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const HeadlineGroup = ({ children, className }: Props) => {
  return <div className={clsx(styles.container, className)}>{children}</div>
}

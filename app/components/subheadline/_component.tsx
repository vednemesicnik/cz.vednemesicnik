import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Subheadline = ({ children, className }: Props) => {
  return <p className={clsx(styles.subheadline, className)}>{children}</p>
}

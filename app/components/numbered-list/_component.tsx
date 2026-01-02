import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export function NumberedList({ children, className }: Props) {
  return <ol className={clsx(styles.list, className)}>{children}</ol>
}

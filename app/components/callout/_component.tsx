import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Callout = ({ children, className }: Props) => {
  return <aside className={clsx(styles.callout, className)}>{children}</aside>
}

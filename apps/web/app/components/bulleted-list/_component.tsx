import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const BulletedList = ({ children, className }: Props) => {
  return <ul className={clsx(styles.list, className)}>{children}</ul>
}

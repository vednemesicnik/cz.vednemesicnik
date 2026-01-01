import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const ContentListItem = ({ children, className }: Props) => {
  return <li className={clsx(styles.listItem, className)}>{children}</li>
}

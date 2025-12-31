import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Group = ({ children, className }: Props) => {
  return (
    <section className={clsx(styles.container, className)}>{children}</section>
  )
}

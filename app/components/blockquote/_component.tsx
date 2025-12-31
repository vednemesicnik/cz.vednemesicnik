import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Blockquote = ({ children, className }: Props) => {
  return (
    <figure className={clsx(styles.container, className)}>
      <blockquote className={styles.blockquote}>{children}</blockquote>
    </figure>
  )
}

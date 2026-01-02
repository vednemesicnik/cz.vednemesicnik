import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Blockquote = ({ children, className }: Props) => {
  return (
    <blockquote className={clsx(styles.blockquote, className)}>
      {children}
    </blockquote>
  )
}

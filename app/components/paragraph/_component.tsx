import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Paragraph = ({ children, className }: Props) => {
  return <p className={clsx(styles.paragraph, className)}>{children}</p>
}

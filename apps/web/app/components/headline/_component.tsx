import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Headline = ({ children, className }: Props) => {
  return <h1 className={clsx(styles.headline, className)}>{children}</h1>
}

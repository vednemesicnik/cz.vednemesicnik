import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Page = ({ children, className }: Props) => {
  return <section className={clsx(styles.page, className)}>{children}</section>
}

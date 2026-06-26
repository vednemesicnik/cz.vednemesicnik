import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const RadioOptionGroup = ({ children }: Props) => (
  <div className={styles.group}>{children}</div>
)

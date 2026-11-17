import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const FormField = ({ children }: Props) => (
  <div className={styles.field}>{children}</div>
)

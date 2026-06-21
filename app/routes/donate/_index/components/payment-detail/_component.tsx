import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  label: string
  children: ReactNode
}

export const PaymentDetail = ({ label, children }: Props) => {
  return (
    <span className={styles.detail}>
      <span className={styles.label}>{label}:</span>
      {children}
    </span>
  )
}

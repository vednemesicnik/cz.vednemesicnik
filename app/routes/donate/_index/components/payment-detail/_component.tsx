import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  label: string
  children: ReactNode
}

/** One payment detail: its name, then its value (with a copy button). */
export const PaymentDetail = ({ label, children }: Props) => {
  return (
    <div className={styles.detail}>
      <dt className={styles.label}>{label}:</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

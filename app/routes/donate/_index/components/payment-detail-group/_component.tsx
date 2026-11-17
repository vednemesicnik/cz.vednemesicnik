import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** The payment details as a list of names and values (15f). */
export const PaymentDetailGroup = ({ children }: Props) => {
  return <dl className={styles.group}>{children}</dl>
}

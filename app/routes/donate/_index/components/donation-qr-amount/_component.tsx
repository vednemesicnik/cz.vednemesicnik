import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationQrAmount = ({ children }: Props) => {
  return <p className={styles.donationAmount}>{children}</p>
}

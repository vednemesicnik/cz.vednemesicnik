import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** The amount the QR code carries, announced when it changes. */
export const DonationQrAmount = ({ children }: Props) => {
  return (
    <p aria-live={'polite'} className={styles.donationAmount}>
      {children}
    </p>
  )
}

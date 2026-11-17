import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationConfirmationDescription = ({ children }: Props) => {
  return <p className={styles.description}>{children}</p>
}

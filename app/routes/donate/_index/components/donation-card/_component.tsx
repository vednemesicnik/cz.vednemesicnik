import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationCard = ({ children }: Props) => {
  return <section className={styles.card}>{children}</section>
}

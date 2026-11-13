import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** The end of the donation card: how to pay from a foreign account (15f, wnyfw8po). */
export const DonationAbroad = ({ children }: Props) => {
  return <section className={styles.abroad}>{children}</section>
}

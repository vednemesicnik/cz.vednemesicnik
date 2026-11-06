import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The address the link carries, which is whose answer the button writes (design 15j). Only
 * the address: the page knows no name, and it is the first one of the member's cell even
 * when the e-mail was opened in another mailbox.
 */
export const AnswerAddress = ({ children }: Props) => (
  <dl className={styles.details}>
    <div className={styles.detail}>
      <dt className={styles.term}>E-mail</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  </dl>
)

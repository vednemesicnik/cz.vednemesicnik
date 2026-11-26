import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * What the feed brings and where its links lead, under the name in `FeedCard` (17a).
 *
 * @param props.children - The sentence
 * @returns The card's text
 */
export const FeedCardText = ({ children }: Props) => {
  return <p className={styles.text}>{children}</p>
}

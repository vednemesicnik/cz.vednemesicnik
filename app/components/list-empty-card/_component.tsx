import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * What stands in place of an empty administration list (design 22e): the
 * table's head goes too, a title, an optional sentence and at most one action
 * stand in its body.
 *
 * @returns The card
 */
export const ListEmptyCard = ({ children }: Props) => (
  <div className={styles.listEmptyCard}>{children}</div>
)

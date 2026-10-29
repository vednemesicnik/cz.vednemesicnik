import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The episode's links on its detail (design 27c), in the order the web lists
 * them: one `EpisodeLinkCard` each.
 */
export const EpisodeLinkList = ({ children }: Props) => (
  <ul className={styles.list}>{children}</ul>
)

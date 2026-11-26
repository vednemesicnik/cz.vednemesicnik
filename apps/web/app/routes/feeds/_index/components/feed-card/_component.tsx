import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  id?: string
}

/**
 * One feed a reader can subscribe to (design 17a): its name, what it brings and
 * its address. Not a link: the card only carries the address to copy. A card
 * the address's fragment points at is framed (17b).
 *
 * @param props.children - `FeedCardTitle`, `FeedCardText` and `FeedCardAddress`.
 * @param props.id - The anchor the podcast page links to, `podcast-{slug}`.
 * @returns The card
 */
export const FeedCard = ({ children, id }: Props) => {
  return (
    <article className={styles.card} id={id}>
      {children}
    </article>
  )
}

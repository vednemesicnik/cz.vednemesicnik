import type { ReactNode } from 'react'

import { EpisodeNumber } from '~/components/episode-number'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  level?: 2 | 3
  number?: number
}

/**
 * The row's title.
 *
 * @param number - A podcast episode's number, shown grey as `#13` before the title
 *   and read by screen readers as *Epizoda 13* (design 13a).
 */
export function ContentLinkTitle({ children, level = 2, number }: Props) {
  const ElementTag = `h${level}` as const

  return (
    <ElementTag className={styles.title}>
      {number !== undefined && (
        <>
          <EpisodeNumber>{number}</EpisodeNumber>{' '}
        </>
      )}
      {children}
    </ElementTag>
  )
}

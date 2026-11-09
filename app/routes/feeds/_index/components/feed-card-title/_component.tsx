import type { ReactNode } from 'react'
import { Heading } from '~/components/heading'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The feed's name in `FeedCard`: *Články*, *Archiv čísel*, *Podcast {název}* (17a).
 *
 * @param props.children - The name
 * @returns The card's heading
 */
export const FeedCardTitle = ({ children }: Props) => {
  return (
    <Heading className={styles.title} level={3}>
      {children}
    </Heading>
  )
}

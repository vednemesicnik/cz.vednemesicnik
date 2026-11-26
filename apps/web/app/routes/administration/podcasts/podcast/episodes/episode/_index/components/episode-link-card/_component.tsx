import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * One link of the episode on its detail (design 27c): the platform's name and
 * the shortened address, on a framed card.
 *
 * @param props.children - `EpisodeLinkCardPlatform`, left out while the link
 *   has no platform's name yet, then `EpisodeLinkCardAddress`.
 */
export const EpisodeLinkCard = ({ className, children }: Props) => (
  <li className={clsx(styles.card, className)}>{children}</li>
)

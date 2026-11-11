import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/** An `EpisodeLinkCard`'s platform name, e.g. „Spotify“. */
export const EpisodeLinkCardPlatform = ({ className, children }: Props) => (
  <span className={clsx(styles.platform, className)}>{children}</span>
)

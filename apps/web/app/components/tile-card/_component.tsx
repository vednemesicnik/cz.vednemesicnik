import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  ratio?: 'square' | 'cover'
}

/**
 * The tile's framed card. Its image fills the frame, cropped around its middle.
 *
 * @param ratio - `square` for a podcast cover (13a), `cover` for a printed
 *   issue's 3 : 4 (14a)
 * @returns The card
 */
export const TileCard = ({ children, className, ratio = 'square' }: Props) => {
  return (
    <div className={clsx(styles.card, styles[ratio], className)}>
      {children}
    </div>
  )
}

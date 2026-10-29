import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The tile's caption under the card: the label, and a `TileSublabel` under it
 * when there is one (design 14a).
 *
 * @returns The caption as a `figcaption`
 */
export const TileCaption = ({ children, className }: Props) => {
  return (
    <figcaption className={clsx(styles.caption, className)}>
      {children}
    </figcaption>
  )
}

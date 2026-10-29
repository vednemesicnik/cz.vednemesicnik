import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A cover tile: a framed card with its caption under it (design 13a, 14a).
 * Compose it from `TileCard` and `TileCaption`.
 *
 * @returns The tile as a `figure`
 */
export const Tile = ({ children, className }: Props) => {
  return (
    <figure className={clsx(styles.container, className)}>{children}</figure>
  )
}

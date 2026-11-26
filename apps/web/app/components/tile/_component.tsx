import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  isPreview?: boolean
}

/**
 * A cover tile: a framed card with its caption under it (design 13a, 14a).
 * Compose it from `TileCard` and `TileCaption`.
 *
 * @param props.isPreview - Outlined, for content the reader doesn't see (10d).
 * @returns The tile as a `figure`
 */
export const Tile = ({ children, className, isPreview }: Props) => {
  return (
    <figure
      className={clsx(styles.container, isPreview && styles.preview, className)}
    >
      {children}
    </figure>
  )
}

import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /**
   * How the tile enters. `"stagger"` (the default) fades it in as part of a
   * chain, `"scroll"` waits until it scrolls into view, and `"none"` is for
   * tiles an earlier render already revealed.
   */
  reveal?: 'stagger' | 'scroll' | 'none'
  /**
   * Position in the chain, overriding the tile's position in the grid. Pass it
   * for appended items so their chain starts over instead of continuing from
   * the items already on the page. Only used with `reveal="stagger"`.
   */
  staggerIndex?: number
}

export function TileGridItem({
  children,
  reveal = 'stagger',
  staggerIndex,
}: Props) {
  const hasStaggerIndex = reveal === 'stagger' && staggerIndex !== undefined

  return (
    <li
      className={clsx(
        styles.container,
        hasStaggerIndex && styles.staggerFromIndex,
        reveal === 'scroll' && styles.scrollRevealed,
        reveal === 'none' && styles.revealed,
      )}
      style={
        hasStaggerIndex
          ? ({ '--tile-enter-index': staggerIndex } as CSSProperties)
          : undefined
      }
    >
      {children}
    </li>
  )
}

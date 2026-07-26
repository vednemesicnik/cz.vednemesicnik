import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

import styles from './_styles.module.css'

/**
 * How the tile enters. `"stagger"` (the default) fades it in as part of a
 * chain, `"scroll"` waits until it scrolls into view, and `"none"` is for tiles
 * an earlier render already revealed.
 *
 * `staggerIndex` overrides the tile's position in the chain — pass it for
 * appended items so their chain starts over instead of continuing from the
 * items already on the page. It only means anything while chaining, so the
 * other two modes reject it.
 */
type RevealProps =
  | { reveal?: 'stagger'; staggerIndex?: number }
  | { reveal: 'scroll' | 'none'; staggerIndex?: never }

type Props = RevealProps & {
  children: ReactNode
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

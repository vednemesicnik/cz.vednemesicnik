import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The design system's `ImageTile`: one image of an editor's gallery (article
 * images, later the issue and episode covers; design 24b, decision 0027). The
 * preview (`ImageTileMedia`) with its pills and „⋯“, then the alt text, the
 * caption and the file name (`ImageTileFile`), 10 px apart. A failed upload
 * says so under the preview (`ImageTileMessage`, `ImageTileActions`). The
 * narrow column's shape is `CompactImageTile`.
 */
export const ImageTile = ({ children, className }: Props) => (
  <div className={clsx(styles.imageTile, className)}>{children}</div>
)

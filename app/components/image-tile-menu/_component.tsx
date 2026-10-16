import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The tile's `ActionMenu`, `variant="chip"`. */
  children: ReactNode
  className?: string
}

/** The place of an image tile's „⋯“: the preview's top end (24b). */
export const ImageTileMenu = ({ children, className }: Props) => (
  <span className={clsx(styles.imageTileMenu, className)}>{children}</span>
)

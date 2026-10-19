import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A pill on an image tile's preview: *Hlavní* (24b). An upload is said under
 * the preview, by `UploadStatus`, not on it (1yxjqzkh).
 */
export const ImageTilePill = ({ children, className }: Props) => (
  <span className={clsx(styles.imageTilePill, className)}>{children}</span>
)

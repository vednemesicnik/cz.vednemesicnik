import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The file's name, and *· zpracovává se* while it processes (24b). */
  children: ReactNode
  className?: string
}

/** The picked file's name under an image tile's fields, small (24b). */
export const ImageTileFile = ({ children, className }: Props) => (
  <p className={clsx(styles.imageTileFile, className)}>{children}</p>
)

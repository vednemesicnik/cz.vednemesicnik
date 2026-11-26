import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * What went wrong with an image tile's file, said as it happens (24b): the
 * upload failed, or the new file of a replacement did not process and the
 * old one stays.
 */
export const ImageTileMessage = ({ children, className }: Props) => (
  <p className={clsx(styles.imageTileMessage, className)} role={'alert'}>
    {children}
  </p>
)

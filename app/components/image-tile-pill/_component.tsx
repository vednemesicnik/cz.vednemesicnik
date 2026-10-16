import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** A passing state (*Zpracovává se*) rather than a mark (*Hlavní*). */
  isMuted?: boolean
  className?: string
}

/** A pill on an image tile's preview: *Hlavní* or *Zpracovává se* (24b). */
export const ImageTilePill = ({
  children,
  isMuted = false,
  className,
}: Props) => (
  <span
    className={clsx(styles.imageTilePill, isMuted && styles.muted, className)}
  >
    {children}
  </span>
)

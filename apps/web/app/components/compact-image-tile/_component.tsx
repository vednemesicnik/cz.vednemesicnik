import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The design system's `ImageTile compact`: an image in the editor's narrow
 * column (design 24a). The preview (`ImageTileMedia`) and one line under it
 * (`ImageTileAltLine`): the first line of the alt text, *Bez alt textu* or
 * *Zpracování selhalo*. Not a button; the gallery opens from *Upravit*.
 */
export const CompactImageTile = ({ children, className }: Props) => (
  <div className={clsx(styles.compactImageTile, className)}>{children}</div>
)

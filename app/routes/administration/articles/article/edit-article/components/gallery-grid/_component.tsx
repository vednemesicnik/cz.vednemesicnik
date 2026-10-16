import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** Three in the panel (24b), two in the narrow column (24a). */
  columns: 2 | 3
  /** `GalleryGridItem`s, then the *Přidat obrázky* tile. */
  children: ReactNode
  className?: string
}

/** The gallery's images in their order, which is the order on the web (24b). */
export const GalleryGrid = ({ columns, children, className }: Props) => (
  <ul
    className={clsx(
      styles.galleryGrid,
      columns === 2 ? styles.twoColumns : styles.threeColumns,
      className,
    )}
  >
    {children}
  </ul>
)

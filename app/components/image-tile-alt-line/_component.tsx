import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** *Bez alt textu*: a reminder, quieter than the alt itself (24a). */
  isMissing?: boolean
  /** *Zpracování selhalo* (24a). */
  isFailed?: boolean
  className?: string
}

/** A compact image tile's one line: the alt text's first line, cut short. */
export const ImageTileAltLine = ({
  children,
  isMissing = false,
  isFailed = false,
  className,
}: Props) => (
  <p
    className={clsx(
      styles.imageTileAltLine,
      isMissing && styles.missing,
      isFailed && styles.failed,
      className,
    )}
  >
    {children}
  </p>
)

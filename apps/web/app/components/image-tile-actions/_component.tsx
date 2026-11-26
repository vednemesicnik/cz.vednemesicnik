import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** `ButtonLink`s: the way out first, a quieter one after (24b). */
  children: ReactNode
  className?: string
}

/** The actions under an image tile's message: *Vybrat jiný soubor* · *Odebrat*. */
export const ImageTileActions = ({ children, className }: Props) => (
  <p className={clsx(styles.imageTileActions, className)}>{children}</p>
)

import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The body of a `GalleryDetailPanel`, under its bar.
 *
 * @param props.children - The gallery: the full tiles and their dialogs.
 */
export const GalleryDetailBody = ({ className, children }: Props) => (
  <div className={clsx(styles.body, className)}>{children}</div>
)

import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The caption under a `FeaturedImage`, the image's description (12a).
 */
export const FeaturedImageCaption = ({ children, className }: Props) => (
  <figcaption className={clsx(styles.caption, className)}>
    {children}
  </figcaption>
)

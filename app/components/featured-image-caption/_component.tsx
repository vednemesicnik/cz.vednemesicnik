import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The caption under a `FeaturedImage`, the image's description (12a).
 */
export const FeaturedImageCaption = ({ children }: Props) => (
  <figcaption className={styles.caption}>{children}</figcaption>
)

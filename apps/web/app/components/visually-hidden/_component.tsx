import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * Text that assistive technology reads but the screen doesn't show, for what
 * sighted people get from the layout: e.g. what a column header's sum covers
 * (28a). Never for text everyone needs.
 */
export const VisuallyHidden = ({ children }: Props) => (
  <span className={styles.visuallyHidden}>{children}</span>
)

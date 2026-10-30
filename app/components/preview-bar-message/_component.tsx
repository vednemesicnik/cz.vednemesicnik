import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The bar's message: an optional `PreviewBarMarker`, the `PreviewBarTitle`
 * and the sentence. It gives way to the action, cut with an ellipsis (10d).
 */
export const PreviewBarMessage = ({ children }: Props) => (
  <p className={styles.message}>{children}</p>
)

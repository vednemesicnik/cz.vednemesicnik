import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** Words the bar shows only below 768 px, in place of `PreviewBarWide` (10d). */
export const PreviewBarNarrow = ({ children }: Props) => (
  <span className={styles.narrow}>{children}</span>
)

import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** Words the bar shows from 768 px; a phone drops them to keep one line (10d). */
export const PreviewBarWide = ({ children }: Props) => (
  <span className={styles.wide}>{children}</span>
)

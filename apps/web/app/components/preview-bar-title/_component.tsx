import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** The bar's lead words, such as „Náhled redakce.“ (10d). */
export const PreviewBarTitle = ({ children }: Props) => (
  <strong className={styles.title}>{children}</strong>
)

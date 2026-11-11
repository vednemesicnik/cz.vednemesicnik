import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The name a `FailedFile` stands under: the PDF's name, the picked cover's.
 */
export const FailedFileName = ({ children }: Props) => (
  <p className={styles.fileName}>{children}</p>
)

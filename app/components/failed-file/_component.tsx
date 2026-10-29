import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The name the file stands under: the PDF's name, the picked cover's. */
  fileName: string
  /** What went wrong and what to do, as `ErrorMessage`s and the actions. */
  children: ReactNode
}

/**
 * A cover or a PDF whose upload failed, in place of its field (design 26d):
 * the file stays picked, with the reason and what to do next.
 */
export const FailedFile = ({ fileName, children }: Props) => (
  <div className={styles.failedFile}>
    <p className={styles.fileName}>{fileName}</p>
    {children}
  </div>
)

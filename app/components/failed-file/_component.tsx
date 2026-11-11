import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A cover or a PDF whose upload failed, in place of its field (design 26d):
 * the file stays picked, with the reason and what to do next.
 *
 * @param props.children - The `FailedFileName`, then what went wrong and what
 *   to do, as `ErrorMessage`s and the actions.
 */
export const FailedFile = ({ children }: Props) => (
  <div className={styles.failedFile}>{children}</div>
)

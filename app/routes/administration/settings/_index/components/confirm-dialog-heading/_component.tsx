import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A `ConfirmDialog`'s title with what is confirmed tight under it (design
 * 29d): the subject belongs to the title.
 *
 * @param props.children - The `AdminModalTitle` and the `ConfirmDialogSubject`.
 * @returns The heading group
 */
export const ConfirmDialogHeading = ({ children }: Props) => {
  return <hgroup className={styles.heading}>{children}</hgroup>
}

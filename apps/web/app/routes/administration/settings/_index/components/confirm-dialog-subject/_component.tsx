import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * What a `ConfirmDialog` confirms, under its title in a `ConfirmDialogHeading`
 * (design 29d), e.g. which passkey.
 *
 * @param props.children - The subject
 * @returns The paragraph
 */
export const ConfirmDialogSubject = ({ children }: Props) => {
  return <p className={styles.subject}>{children}</p>
}

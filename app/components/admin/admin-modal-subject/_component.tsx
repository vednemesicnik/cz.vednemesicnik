import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * What a dialog acts on, on its own line under the title (design 23e, 23f):
 * the article by its title, never declined into a sentence.
 *
 * @param props.children - The subject, e.g. the article's title.
 */
export const AdminModalSubject = ({ children }: Props) => {
  return <p className={styles.subject}>{children}</p>
}

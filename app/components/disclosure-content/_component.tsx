import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** What a `Disclosure` shows when open, flush with the summary, its parts 12 px apart. */
export const DisclosureContent = ({ children }: Props) => {
  return <div className={styles.content}>{children}</div>
}

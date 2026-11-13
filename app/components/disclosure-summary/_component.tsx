import type { ReactNode } from 'react'

import { ChevronRightIcon } from '~/components/icons/chevron-right-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** The always-visible line of a `Disclosure`: a link-like question with a chevron that turns down when open. */
export const DisclosureSummary = ({ children }: Props) => {
  return (
    <summary className={styles.summary}>
      <ChevronRightIcon className={styles.chevron} />
      <span className={styles.text}>{children}</span>
    </summary>
  )
}

import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_page.module.css'

type Props = {
  children: ReactNode
  alignment?: 'responsive' | 'start'
}

/**
 * The page's content column.
 *
 * @param alignment - `responsive` (default) centres below 768 px and aligns to the start above; `start` aligns to the start at every width.
 * @returns The page section
 */
export const Page = ({ children, alignment = 'responsive' }: Props) => {
  return (
    <section
      className={clsx(styles.page, alignment === 'start' && styles.start)}
    >
      {children}
    </section>
  )
}

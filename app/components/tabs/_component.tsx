import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  label: string
}

/**
 * Section tabs above a page title (Články · Rubriky · Štítky, design 22a).
 * Every tab is its own address, so the tabs are links in a navigation, not a
 * client-side switch. Compose it from `TabsItem`s.
 *
 * @param props.label - The navigation's accessible name (e.g. „Články“).
 * @param props.children - The `TabsItem`s in display order.
 * @returns The tabs
 */
export const Tabs = ({ children, className, label }: Props) => {
  return (
    <nav aria-label={label} className={clsx(styles.tabs, className)}>
      <ul className={styles.list}>{children}</ul>
    </nav>
  )
}

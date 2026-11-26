import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The sidebar's sections (design 22a): content on top, people below an
 * `AdministrationSidebarSeparator`. Callers put in only the sections the user
 * may see.
 *
 * @param props.children - The `AdministrationSidebarList`s and their separator
 * @returns The `<nav>` landmark „Administrace“
 */
export const AdministrationSidebarNav = ({ children, className }: Props) => {
  return (
    <nav aria-label={'Administrace'} className={clsx(styles.nav, className)}>
      {children}
    </nav>
  )
}

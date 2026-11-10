import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One group of the sidebar's sections, e.g. the content ones (Přehled,
 * Články, …).
 *
 * @param props.children - The group's `AdministrationSidebarItem`s
 * @returns The list
 */
export const AdministrationSidebarList = ({ children, className }: Props) => {
  return <ul className={clsx(styles.list, className)}>{children}</ul>
}

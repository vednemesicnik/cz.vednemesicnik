import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The page's name in the `AdministrationTopBar` (22g): the label of the active
 * sidebar item, Nastavení on the account pages. Not shown while a boundary
 * turns the sidebar's highlight off (30e, 30h): the bar then holds only the
 * logo and Menu (22j).
 *
 * @param props.children - The label.
 */
export const AdministrationTopBarTitle = ({ children, className }: Props) => {
  const highlightsSection = useSidebarHighlight()

  if (!highlightsSection) return null

  return <span className={clsx(styles.title, className)}>{children}</span>
}

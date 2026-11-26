import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'
import { AdministrationSidebarLink } from '~/components/administration-sidebar-link'
import { useAdministrationSidebarShape } from '~/components/administration-sidebar-shape-provider'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  end?: boolean
  className?: string
}

/**
 * One section in an `AdministrationSidebarList`, filled while the page is in
 * it (design 22a).
 *
 * @param props.children - The section's name, e.g. „Články“
 * @param props.to - The section's page
 * @param props.end - Active only on that exact page, as Přehled
 * @returns The list item with its link
 */
export const AdministrationSidebarItem = ({
  children,
  to,
  end,
  className,
}: Props) => {
  const highlightsSection = useSidebarHighlight()
  const shape = useAdministrationSidebarShape()

  return (
    <li className={clsx(styles.item, className)}>
      <AdministrationSidebarLink
        className={clsx(shape === 'full-screen' && styles.fullScreenLink)}
        end={end}
        highlightsActive={highlightsSection}
        to={to}
      >
        {children}
      </AdministrationSidebarLink>
    </li>
  )
}

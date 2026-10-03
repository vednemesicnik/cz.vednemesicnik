import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'

import styles from './_styles.module.css'
import { SidebarLink } from './components/sidebar-link'

export type NavigationItem = {
  to: string
  label: string
  visible: boolean
  end?: boolean
}

type Props = {
  navigationItems: NavigationItem[]
}

export const AdministrationSidebar = ({ navigationItems }: Props) => {
  const visibleItems = navigationItems.filter((item) => item.visible)
  const highlightsSection = useSidebarHighlight()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {visibleItems.map((item) => (
            <li className={styles.item} key={item.to}>
              <SidebarLink
                end={item.end}
                highlightsActive={highlightsSection}
                to={item.to}
              >
                {item.label}
              </SidebarLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

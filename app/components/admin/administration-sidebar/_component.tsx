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

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {visibleItems.map((item) => (
            <li className={styles.item} key={item.to}>
              <SidebarLink end={item.end} to={item.to}>
                {item.label}
              </SidebarLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

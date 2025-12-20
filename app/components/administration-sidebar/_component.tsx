import styles from "./_styles.module.css"
import { SidebarLink } from "./components/sidebar-link"

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
            <li key={item.to} className={styles.item}>
              <SidebarLink to={item.to} end={item.end}>
                {item.label}
              </SidebarLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

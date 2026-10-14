import { clsx } from 'clsx'
import { NavLink } from 'react-router'

import styles from './_styles.module.css'

type TabsItem = {
  label: string
  to: string
  end?: boolean
}

type Props = {
  className?: string
  items: TabsItem[]
  label: string
}

/**
 * Section tabs above a page title (Články · Rubriky · Štítky, design 22a).
 * Every tab is its own address, so the tabs are links in a navigation, not a
 * client-side switch; the active one carries `aria-current="page"`.
 *
 * @param props.label - The navigation's accessible name (e.g. „Články“).
 * @param props.items - The tabs in display order; `end` matches the address exactly.
 * @returns The tabs
 */
export const Tabs = ({ className, items, label }: Props) => {
  return (
    <nav aria-label={label} className={clsx(styles.tabs, className)}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li className={styles.item} key={item.to}>
            <NavLink
              className={({ isActive }) =>
                clsx(styles.tab, isActive && styles.active)
              }
              data-label={item.label}
              end={item.end}
              to={item.to}
              viewTransition={true}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

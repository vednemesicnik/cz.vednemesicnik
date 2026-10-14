import { clsx } from 'clsx'
import { NavLink } from 'react-router'

import styles from './_styles.module.css'

type Props = {
  children: string
  end?: boolean
  to: string
}

/**
 * One tab of `Tabs` (design 22a): a link to its own page, marked with
 * `aria-current="page"` while that page is open.
 *
 * @param props.children - The tab's label; it also reserves the active width.
 * @param props.end - Match the address exactly, so a parent address is not active under its children.
 * @returns The tab
 */
export const TabsItem = ({ children, end, to }: Props) => {
  return (
    <li className={styles.item}>
      <NavLink
        className={({ isActive }) =>
          clsx(styles.tab, isActive && styles.active)
        }
        data-label={children}
        end={end}
        to={to}
        viewTransition={true}
      >
        {children}
      </NavLink>
    </li>
  )
}

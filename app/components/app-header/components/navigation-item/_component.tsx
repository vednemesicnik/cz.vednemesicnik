import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
}

export const NavigationItem = ({ children, to }: Props) => (
  <li className={styles.container}>
    <NavLink
      className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
      prefetch={'intent'}
      to={to}
      viewTransition={true}
    >
      {children}
    </NavLink>
  </li>
)

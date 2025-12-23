import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

import styles from './_styles.module.css'

type Props = {
  to: string
  children: ReactNode
  end?: boolean
}

export const AdminTab = ({ to, children, end = false }: Props) => {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive ? `${styles.tab} ${styles['tab--active']}` : styles.tab
      }
      end={end}
      to={to}
      viewTransition={true}
    >
      {children}
    </NavLink>
  )
}

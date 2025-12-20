import { applyClasses, combineClasses } from '@liborgabrhel/style-utils'
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
      className={({ isActive }) =>
        combineClasses(styles.link, applyClasses(styles.active).if(isActive))
      }
      prefetch={'intent'}
      to={to}
      viewTransition={true}
    >
      {children}
    </NavLink>
  </li>
)

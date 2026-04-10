import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { NavLink, useMatch } from 'react-router'

import styles from './_styles.module.css'

type Props = ComponentProps<typeof NavLink>

export const SidebarLink = ({ children, to, end = false, ...rest }: Props) => {
  const pattern = typeof to === 'string' ? to : (to.pathname ?? '')
  const match = useMatch(pattern)
  const isCurrentPage = match !== null

  return (
    <NavLink
      aria-current={isCurrentPage ? 'page' : undefined}
      className={({ isActive }) =>
        clsx(styles.link, isActive && styles.linkActive)
      }
      end={end}
      prefetch={'intent'}
      to={to}
      viewTransition={true}
      {...rest}
    >
      {children}
    </NavLink>
  )
}

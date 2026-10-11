import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { NavLink, useMatch } from 'react-router'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<typeof NavLink>, 'className'> & {
  className?: string
  highlightsActive?: boolean
}

export const SidebarLink = ({
  children,
  className,
  to,
  end = false,
  highlightsActive = true,
  ...rest
}: Props) => {
  const pattern = typeof to === 'string' ? to : (to.pathname ?? '')
  const match = useMatch(pattern)
  const isCurrentPage = match !== null

  return (
    <NavLink
      aria-current={isCurrentPage ? 'page' : undefined}
      className={({ isActive }) =>
        clsx(
          styles.link,
          className,
          isActive && highlightsActive && styles.linkActive,
        )
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
